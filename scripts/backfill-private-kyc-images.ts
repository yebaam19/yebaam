/**
 * One-shot backfill: flip every existing verification_photos.cf_image_id and
 * id_documents.cf_image_id to requireSignedURLs=true on Cloudflare Images.
 *
 * Why: Layer 1 (the 2026-05-02 RLS fix) closed the listing leak. Layer 2 makes
 * future uploads private at the Cloudflare layer. This script handles the
 * already-uploaded rows from before the fix.
 *
 * Run with:
 *   pnpm tsx scripts/backfill-private-kyc-images.ts
 *
 * Requires env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN,
 * NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (to bypass RLS for read).
 *
 * Idempotent: re-running has no effect once images are already private.
 */

import { createClient } from '@supabase/supabase-js';

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
  console.error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in env');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

async function patchImage(cfImageId: string): Promise<{ ok: boolean; alreadyPrivate?: boolean; error?: string }> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/${cfImageId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requireSignedURLs: true }),
    },
  );
  type CfEnvelope = {
    success: boolean;
    errors?: Array<{ code: number; message: string }>;
    result?: { requireSignedURLs: boolean };
  };
  const body = (await res.json().catch(() => null)) as CfEnvelope | null;
  if (!res.ok || !body?.success) {
    const code = body?.errors?.[0]?.code;
    const msg = body?.errors?.[0]?.message ?? `HTTP ${res.status}`;
    // 5408 = "Image not found" - row points to a deleted CF image. Skip.
    if (code === 5408) return { ok: true, alreadyPrivate: false, error: 'image-not-found' };
    return { ok: false, error: msg };
  }
  return { ok: true, alreadyPrivate: body.result?.requireSignedURLs === true };
}

async function backfillTable(table: 'verification_photos' | 'id_documents') {
  console.log(`\n[${table}] fetching rows…`);
  const { data, error } = await sb.from(table).select('cf_image_id');
  if (error) {
    console.error(`  ERROR: ${error.message}`);
    return;
  }
  console.log(`  ${data.length} rows`);

  let updated = 0;
  let alreadyPrivate = 0;
  let notFound = 0;
  let failed = 0;

  for (const row of data) {
    const id = (row as { cf_image_id: string }).cf_image_id;
    const r = await patchImage(id);
    if (!r.ok) {
      failed++;
      console.error(`  ✗ ${id}: ${r.error}`);
      continue;
    }
    if (r.error === 'image-not-found') {
      notFound++;
      continue;
    }
    if (r.alreadyPrivate) alreadyPrivate++;
    else updated++;
  }

  console.log(`  → updated: ${updated}, already-private: ${alreadyPrivate}, not-found: ${notFound}, failed: ${failed}`);
}

async function main() {
  console.log('Backfilling Cloudflare Images requireSignedURLs=true for KYC tables…');
  await backfillTable('verification_photos');
  await backfillTable('id_documents');
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
