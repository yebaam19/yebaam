'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';

/**
 * Server Actions for the city public-chat panel.
 *
 * Authentication is handled with the same `requireSession()` shape that
 * `city.actions.ts` uses — keep them aligned so the unauth bounce-to-login
 * path on the client island is identical across portal features. The action
 * never trusts the caller for `sender_id`; we always read `auth.uid()` from
 * the session-bound client.
 */

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type Session = { userId: string; client: SupabaseClient };

async function requireSession(): Promise<Session | { error: string }> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  if (!data.user) return { error: 'unauthenticated' };
  return { userId: data.user.id, client };
}

const MAX_BODY_LEN = 2000;
const RATE_WINDOW_MS = 10_000;
const RATE_MAX_PER_WINDOW = 5;
const RATE_MIN_GAP_MS = 1_500;

export async function sendCityPublicChatMessage(
  topicId: string,
  body: string,
  attachmentCfImageId?: string,
): Promise<ActionResult<{ id: string }>> {
  const sess = await requireSession();
  if ('error' in sess) return { ok: false, error: sess.error };

  const trimmed = (body ?? '').trim();
  if (!trimmed && !attachmentCfImageId) {
    return { ok: false, error: 'empty' };
  }
  if (trimmed.length > MAX_BODY_LEN) {
    return { ok: false, error: 'too_long' };
  }

  // Rate limit, mirroring chat-publico on the same public_chat_messages table:
  // 5 messages / 10s with a 1.5s minimum gap, keyed on the sender.
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { data: recent } = await sess.client
    .from('public_chat_messages')
    .select('created_at')
    .eq('sender_id', sess.userId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(RATE_MAX_PER_WINDOW);
  if (recent && recent.length >= RATE_MAX_PER_WINDOW) {
    return { ok: false, error: 'rate_limited' };
  }
  const lastAt = (recent?.[0] as { created_at: string } | undefined)?.created_at;
  if (lastAt && Date.now() - new Date(lastAt).getTime() < RATE_MIN_GAP_MS) {
    return { ok: false, error: 'rate_limited' };
  }

  const insertPayload: Record<string, unknown> = {
    topic_id: topicId,
    sender_id: sess.userId,
    sender_kind: 'profile',
    content: trimmed || null,
    is_deleted: false,
  };
  // Persist only the Cloudflare image id — never the full delivery URL (the
  // account hash can rotate / variants change); the read path rebuilds it.
  if (attachmentCfImageId) {
    insertPayload.media_type = 'image';
    insertPayload.media_meta = { cf_image_id: attachmentCfImageId };
  }

  const { data, error } = await sess.client
    .from('public_chat_messages')
    .insert(insertPayload)
    .select('id')
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'insert_returned_no_row' };

  // The matching client subscriber gets the INSERT broadcast — no extra
  // round-trip needed. revalidatePath only matters for users without
  // realtime (search engines, RSS-style re-fetch), so it's cheap.
  revalidatePath('/cities/[slug]/public-chat', 'page');

  return { ok: true, data: { id: data.id as string } };
}
