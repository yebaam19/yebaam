'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';

/**
 * Server actions for user-submitted city media (photos & videos).
 *
 * RLS (`city_photos_uploader_insert` / `city_videos_uploader_insert` in
 * `20260516120000_city_portal.sql`) lets ANY authenticated user insert rows
 * stamped with their own `uploader_id`; the delete policies let the uploader
 * or a city admin remove them, so moderation is post-publication.
 *
 * The client uploads the binary to Cloudflare first (via `uploadService`) and
 * only the bare CF image id / Stream uid is persisted here — never a full
 * delivery URL (house rule; URLs are rebuilt at render time).
 *
 * Same conventions as `city.actions.ts`: local `requireSession()` and a
 * discriminated `ActionResult<T>` so callers branch on `ok` instead of
 * catching redacted server errors.
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function submitCityPhoto(input: {
  cityId: string;
  cfImageId: string;
  caption?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const sess = await requireSession();
  if ('error' in sess) return { ok: false, error: sess.error };
  if (!UUID_RE.test(input.cityId)) return { ok: false, error: 'invalid_city' };
  if (!input.cfImageId) return { ok: false, error: 'missing_input' };

  const { data, error } = await sess.client
    .from('city_photos')
    .insert({
      city_id: input.cityId,
      cf_image_id: input.cfImageId,
      caption: input.caption?.trim() || null,
      uploader_id: sess.userId,
    })
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'insert_returned_no_row' };

  revalidatePath('/cities/[slug]', 'page');
  revalidatePath('/cities/[slug]/photos', 'page');
  return { ok: true, data: { id: (data as { id: string }).id } };
}

export async function submitCityVideo(input: {
  cityId: string;
  cfVideoUid: string;
  caption?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const sess = await requireSession();
  if ('error' in sess) return { ok: false, error: sess.error };
  if (!UUID_RE.test(input.cityId)) return { ok: false, error: 'invalid_city' };
  if (!input.cfVideoUid) return { ok: false, error: 'missing_input' };

  const { data, error } = await sess.client
    .from('city_videos')
    .insert({
      city_id: input.cityId,
      cf_video_uid: input.cfVideoUid,
      caption: input.caption?.trim() || null,
      uploader_id: sess.userId,
    })
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'insert_returned_no_row' };

  revalidatePath('/cities/[slug]', 'page');
  revalidatePath('/cities/[slug]/videos', 'page');
  return { ok: true, data: { id: (data as { id: string }).id } };
}
