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

  const accountHash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? '';
  const mediaUrl =
    attachmentCfImageId && accountHash
      ? `https://imagedelivery.net/${accountHash}/${attachmentCfImageId}/public`
      : null;

  const insertPayload: Record<string, unknown> = {
    topic_id: topicId,
    sender_id: sess.userId,
    sender_kind: 'profile',
    content: trimmed || null,
    is_deleted: false,
  };
  if (mediaUrl) {
    insertPayload.media_url = mediaUrl;
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
