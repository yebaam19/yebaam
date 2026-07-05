/**
 * One-shot backfill: encrypt historical private-chat messages at rest
 * (AES-256-GCM, same format as src/lib/server/chat-crypto.ts).
 *
 * Scope: messages in conversations with `club_id IS NULL` (direct + salitas).
 * Club public chats stay plaintext by policy; soft-deleted tombstones have
 * empty content and are skipped.
 *
 * ⚠️ RUN ORDER MATTERS: deploy the decrypt-aware app (with CHAT_ENCRYPTION_KEY
 * set in the hosting env) BEFORE running this — the old deployed code renders
 * raw rows, so encrypting first would show ciphertext to live users.
 *
 * Run with:
 *   node scripts/encrypt-chat-backfill.mjs            # dry-run (default)
 *   node scripts/encrypt-chat-backfill.mjs --apply    # write changes
 *
 * Idempotent: rows already prefixed `enc:v1:` are excluded by the query, so
 * re-running never double-encrypts.
 */

import { createClient } from '@supabase/supabase-js';
import { createCipheriv, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local');
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const APPLY = process.argv.includes('--apply');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ENC_KEY_B64 = process.env.CHAT_ENCRYPTION_KEY;
const KEY_ID = (process.env.CHAT_ENCRYPTION_KEY_ID ?? 'k1').trim();

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!ENC_KEY_B64) {
  console.error('Missing CHAT_ENCRYPTION_KEY');
  process.exit(1);
}
const key = Buffer.from(ENC_KEY_B64, 'base64');
if (key.length !== 32) {
  console.error(`CHAT_ENCRYPTION_KEY must be 32 bytes base64 (got ${key.length})`);
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function encrypt(plaintext, conversationId) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(conversationId, 'utf8'));
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const packed = Buffer.concat([iv, ciphertext, cipher.getAuthTag()]);
  return `enc:v1:${KEY_ID}:${packed.toString('base64')}`;
}

async function main() {
  const { data: privateConvs, error: convErr } = await db
    .from('conversations')
    .select('id')
    .is('club_id', null);
  if (convErr) throw new Error(`conversations query failed: ${convErr.message}`);
  const convIds = (privateConvs ?? []).map((c) => c.id);
  console.log(`${convIds.length} private conversations`);

  let scanned = 0;
  let updated = 0;
  let failed = 0;

  const CHUNK = 50;
  for (let i = 0; i < convIds.length; i += CHUNK) {
    const chunk = convIds.slice(i, i + CHUNK);
    const { data: rows, error: msgErr } = await db
      .from('messages')
      .select('id, conversation_id, content')
      .in('conversation_id', chunk)
      .neq('content', '')
      .not('content', 'like', 'enc:v1:%');
    if (msgErr) throw new Error(`messages query failed: ${msgErr.message}`);

    for (const row of rows ?? []) {
      scanned++;
      if (!APPLY) continue;
      const { error: upErr } = await db
        .from('messages')
        .update({ content: encrypt(row.content, row.conversation_id) })
        .eq('id', row.id)
        // Guard against a concurrent edit that re-encrypted this row already.
        .not('content', 'like', 'enc:v1:%');
      if (upErr) {
        failed++;
        console.error(`  FAILED ${row.id}: ${upErr.message}`);
      } else {
        updated++;
      }
    }
    console.log(`…${Math.min(i + CHUNK, convIds.length)}/${convIds.length} conversations`);
  }

  console.log(
    APPLY
      ? `Done. ${updated} messages encrypted, ${failed} failed (of ${scanned} plaintext found).`
      : `DRY-RUN. ${scanned} plaintext private messages would be encrypted. Re-run with --apply.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
