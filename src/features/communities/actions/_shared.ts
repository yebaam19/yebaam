import 'server-only';
import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/utils/supabase/server';

/**
 * Shared helpers for the communities server actions. The per-domain action
 * files (`create`/`update`/`members`/`moderation`/`queries`) all gate on
 * {@link requireUserId} and revalidate via {@link revalidateCommunityPaths}.
 */

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Current authenticated user id, or null when signed out. */
export async function requireUserId(): Promise<string | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

/** Revalidate the communities list and, when known, the affected detail page. */
export function revalidateCommunityPaths(slug?: string) {
  revalidatePath('/feed/comunidades');
  if (slug) revalidatePath(`/feed/comunidades/${slug}`);
}
