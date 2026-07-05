import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * At-rest encryption for private chat messages (AES-256-GCM).
 *
 * Governance constraints (Macro Reglamento): true zero-knowledge E2EE is
 * prohibited (Art. 12 judicial handover ≤12h includes chat content; Art. 11
 * due process), and routine decryption for moderation is equally prohibited
 * (Art. 2 Safe Harbor). The compliant posture is ciphertext at rest with the
 * key held OUTSIDE the database (env only — a DB dump leaks nothing), where
 * plaintext exists only inside participant-authenticated request handlers and
 * the two audited compliance triggers (judicial protocol / participant report,
 * both logged to `compliance_access_log`).
 *
 * Stored format: `enc:v1:<keyId>:<base64(iv || ciphertext || authTag)>`
 * AAD = conversation_id, so a ciphertext moved to another conversation's row
 * fails authentication. `keyId` enables rotation: new writes use the primary
 * key; decryption also accepts keys listed in CHAT_ENCRYPTION_KEYS_RETIRED.
 */

const ENC_PREFIX = 'enc:v1:';
const IV_BYTES = 12;
const TAG_BYTES = 16;

/** Returned instead of throwing when a ciphertext can't be decrypted (missing
 * or wrong key) so one bad row never breaks a whole thread/list response. */
export const UNDECRYPTABLE_PLACEHOLDER = '[Mensaje cifrado]';

type KeyRing = { primaryId: string; keys: Map<string, Buffer> };

let cachedKeyRing: KeyRing | null | undefined;
let warnedMissingKey = false;

function parseKey(base64: string, label: string): Buffer | null {
  try {
    const key = Buffer.from(base64.trim(), 'base64');
    if (key.length !== 32) {
      console.error(`[chat-crypto] ${label} must be 32 bytes base64 (got ${key.length})`);
      return null;
    }
    return key;
  } catch {
    console.error(`[chat-crypto] ${label} is not valid base64`);
    return null;
  }
}

function loadKeyRing(): KeyRing | null {
  if (cachedKeyRing !== undefined) return cachedKeyRing;

  const primaryB64 = process.env.CHAT_ENCRYPTION_KEY;
  if (!primaryB64) {
    cachedKeyRing = null;
    return null;
  }
  const primary = parseKey(primaryB64, 'CHAT_ENCRYPTION_KEY');
  if (!primary) {
    cachedKeyRing = null;
    return null;
  }

  const primaryId = (process.env.CHAT_ENCRYPTION_KEY_ID ?? 'k1').trim();
  const keys = new Map<string, Buffer>([[primaryId, primary]]);

  // Optional retired keys for rotation, format: "k0:<base64>,kOld:<base64>"
  for (const entry of (process.env.CHAT_ENCRYPTION_KEYS_RETIRED ?? '').split(',')) {
    const sep = entry.indexOf(':');
    if (sep <= 0) continue;
    const id = entry.slice(0, sep).trim();
    const key = parseKey(entry.slice(sep + 1), `CHAT_ENCRYPTION_KEYS_RETIRED[${id}]`);
    if (id && key && !keys.has(id)) keys.set(id, key);
  }

  cachedKeyRing = { primaryId, keys };
  return cachedKeyRing;
}

/** True when the encryption key is configured — the write path encrypts and
 * the UI may advertise the conversation as encrypted. */
export function chatCryptoReady(): boolean {
  return loadKeyRing() !== null;
}

export function isEncryptedContent(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX);
}

/**
 * Encrypt a message body for storage. Empty strings pass through (soft-delete
 * tombstones clear content to ''). If no key is configured we fail OPEN
 * (store plaintext, log loudly once) so chat keeps working before the env var
 * ships — the deploy runbook makes configuring the key step 1.
 */
export function encryptChatContent(plaintext: string, conversationId: string): string {
  if (!plaintext) return plaintext;
  const ring = loadKeyRing();
  if (!ring) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.error(
        '[chat-crypto] CHAT_ENCRYPTION_KEY is not set — private messages are being stored in PLAINTEXT. ' +
          'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
      );
    }
    return plaintext;
  }
  if (isEncryptedContent(plaintext)) return plaintext; // never double-encrypt

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', ring.keys.get(ring.primaryId)!, iv);
  cipher.setAAD(Buffer.from(conversationId, 'utf8'));
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const packed = Buffer.concat([iv, ciphertext, cipher.getAuthTag()]);
  return `${ENC_PREFIX}${ring.primaryId}:${packed.toString('base64')}`;
}

/**
 * Decrypt a stored message body. Legacy plaintext rows (no prefix) pass
 * through untouched, so mixed pre/post-rollout history renders fine. A
 * ciphertext we can't open (missing/rotated-away key, tampered row) returns
 * UNDECRYPTABLE_PLACEHOLDER instead of throwing.
 */
export function decryptChatContent(stored: string, conversationId: string): string {
  if (!isEncryptedContent(stored)) return stored;

  const rest = stored.slice(ENC_PREFIX.length);
  const sep = rest.indexOf(':');
  if (sep <= 0) return UNDECRYPTABLE_PLACEHOLDER;
  const keyId = rest.slice(0, sep);

  const key = loadKeyRing()?.keys.get(keyId);
  if (!key) {
    console.error(`[chat-crypto] no key available for keyId "${keyId}"`);
    return UNDECRYPTABLE_PLACEHOLDER;
  }

  try {
    const packed = Buffer.from(rest.slice(sep + 1), 'base64');
    if (packed.length < IV_BYTES + TAG_BYTES) return UNDECRYPTABLE_PLACEHOLDER;
    const iv = packed.subarray(0, IV_BYTES);
    const tag = packed.subarray(packed.length - TAG_BYTES);
    const ciphertext = packed.subarray(IV_BYTES, packed.length - TAG_BYTES);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(Buffer.from(conversationId, 'utf8'));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    console.error('[chat-crypto] decryption failed for a message in conversation', conversationId);
    return UNDECRYPTABLE_PLACEHOLDER;
  }
}

/**
 * Policy gate: which conversations get at-rest encryption. Club public chats
 * share the `conversations` table but are open, moderated surfaces — they stay
 * server-readable. Everything else (direct + group "salitas") is private.
 */
export function isPrivateConversation(conv: { club_id: string | null }): boolean {
  return !conv.club_id;
}
