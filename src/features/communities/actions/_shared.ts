import 'server-only';
import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/utils/supabase/server';

/**
 * Shared helpers for the communities server actions. The per-domain action
 * files (`create`/`update`/`members`/`moderation`/`queries`) all gate on
 * {@link requireUserId} and revalidate via {@link revalidateCommunityPaths}.
 */

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

type ServerClient = Awaited<ReturnType<typeof getServerClient>>;
export type Session = { userId: string; client: ServerClient };

/** Current authenticated user id, or null when signed out. */
export async function requireUserId(): Promise<string | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Current session — the user id paired with the session-bound client that
 * issued it — or null when signed out. Saves callers a second `getServerClient`
 * + `getUser` round-trip when they need both the id and an RLS-scoped client.
 */
export async function requireSession(): Promise<Session | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  return { userId: data.user.id, client };
}

/** Revalidate the communities list and, when known, the affected detail page. */
export function revalidateCommunityPaths(slug?: string) {
  revalidatePath('/feed/comunidades');
  if (slug) revalidatePath(`/feed/comunidades/${slug}`);
}
