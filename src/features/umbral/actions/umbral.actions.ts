'use server';

import { encryptChatContent } from '@/lib/server/chat-crypto';
import { getServerClient } from '@/utils/supabase/server';
import { CLAVE_MAX_LENGTH, CLAVE_RATE_LIMIT_PER_HOUR, UMBRAL_RESPONSES } from '../constants';

/**
 * Pronouncing a clave at El Umbral. The page leads nowhere by design
 * (clave-1.pdf): no attempt ever unlocks anything — every attempt is simply
 * recorded (marketing signal) and answered with a deterministic cryptic
 * reply. Requiring a session here is the stunt's conversion mechanic:
 * sharing the link is free, speaking to the door costs a profile.
 */

export type PronounceClaveResult =
  | { ok: true; data: { reply: string; attemptNumber: number | null } }
  | { ok: false; error: 'not_authenticated' | 'empty' | 'rate_limited' | 'unknown' };

/** djb2 — equal claves always earn the same reply, so the door "remembers". */
function hashAttempt(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) + hash + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export async function pronounceClave(rawAttempt: string): Promise<PronounceClaveResult> {
  // Slice by code points, not UTF-16 units — a plain .slice() can cut an
  // astral char (emoji) in half and leave a lone surrogate in the payload.
  const attempt = Array.from((typeof rawAttempt === 'string' ? rawAttempt : '').trim())
    .slice(0, CLAVE_MAX_LENGTH)
    .join('');
  if (!attempt) return { ok: false, error: 'empty' };

  const client = await getServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  // The door stops listening after a few calls per hour — anti-abuse, and
  // scarcity is better lore than an infinite guess box.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCount, error: countError } = await client
    .from('umbral_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneHourAgo);
  if (countError) {
    console.error('[umbral] rate-limit count failed:', countError.message);
    return { ok: false, error: 'unknown' };
  }
  if ((recentCount ?? 0) >= CLAVE_RATE_LIMIT_PER_HOUR) {
    return { ok: false, error: 'rate_limited' };
  }

  // AES-256-GCM at rest (same posture as chat content, Macro Art.8): people
  // WILL type real secrets into a box that asks for "la clave", so the raw
  // text never lands plaintext in the DB. AAD binds the ciphertext to its
  // owner's row. Fail-open semantics (missing key → plaintext + loud log)
  // match the chat write path.
  const { error: insertError } = await client
    .from('umbral_attempts')
    .insert({ user_id: user.id, attempt: encryptChatContent(attempt, `umbral:${user.id}`) });
  if (insertError) {
    // The DB trigger is the firm cap (race-free, covers direct PostgREST);
    // the count above is just the cheap early exit.
    if (insertError.message.includes('umbral_rate_limited')) {
      return { ok: false, error: 'rate_limited' };
    }
    console.error('[umbral] attempt insert failed:', insertError.message);
    return { ok: false, error: 'unknown' };
  }

  const { count: totalCount, error: totalError } = await client
    .from('umbral_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const normalized = attempt.toLocaleLowerCase('es').replace(/\s+/g, ' ');
  const reply = UMBRAL_RESPONSES[hashAttempt(normalized) % UMBRAL_RESPONSES.length];

  // A failed count must not fake "llamado n.º 1" — null hides the line.
  return { ok: true, data: { reply, attemptNumber: totalError ? null : (totalCount ?? 1) } };
}
