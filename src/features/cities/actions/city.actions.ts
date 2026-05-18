'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';

/**
 * Server actions for the City Portal cover (PDF page 4 "Seguir" button).
 *
 * The follow/unfollow pair mirrors the `joinCommunity` / `leaveCommunity`
 * shape from `src/features/communities/actions/communities.actions.ts`:
 * a discriminated `ActionResult<T>` so the client island can react to
 * `{ ok: false, error: 'unauthenticated' }` and bounce to /login without
 * inventing a separate convention.
 */

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type Session = { userId: string; client: SupabaseClient };

/**
 * Resolve the calling user + an RLS-bound client in one shot — collapses the
 * duplicate `getServerClient()` + `auth.getUser()` pattern from the
 * communities feature into a single call. Returns a sentinel object instead
 * of throwing so callers can branch on `'error' in sess`.
 */
async function requireSession(): Promise<Session | { error: string }> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  if (!data.user) return { error: 'unauthenticated' };
  return { userId: data.user.id, client };
}

export async function followCity(
  cityId: string,
): Promise<ActionResult<{ following: true }>> {
  const sess = await requireSession();
  if ('error' in sess) return { ok: false, error: sess.error };

  // `ignoreDuplicates` makes the call idempotent — repeated clicks on a
  // flaky network do not flip RLS into a permission error or duplicate
  // the counter trigger fire.
  const { error } = await sess.client
    .from('city_followers')
    .upsert(
      { city_id: cityId, user_id: sess.userId },
      { onConflict: 'city_id,user_id', ignoreDuplicates: true },
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath('/cities/[slug]', 'page');
  return { ok: true, data: { following: true } };
}

export async function unfollowCity(
  cityId: string,
): Promise<ActionResult<{ following: false }>> {
  const sess = await requireSession();
  if ('error' in sess) return { ok: false, error: sess.error };

  const { error } = await sess.client
    .from('city_followers')
    .delete()
    .eq('city_id', cityId)
    .eq('user_id', sess.userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/cities/[slug]', 'page');
  return { ok: true, data: { following: false } };
}
