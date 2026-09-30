import 'server-only';
import type { getServerClient } from '@/utils/supabase/server';
import { loadMyReactions, loadProfilesForPosts, mapPost, type PostRow } from './posts';

type SessionClient = Awaited<ReturnType<typeof getServerClient>>;
type TimelineResult = {
  data: ReturnType<typeof mapPost>[];
  error: { message: string } | null;
};

/** Only use a caller-bound client and an independently verified viewer ID. */
export async function loadTimelinePosts(
  client: SessionClient,
  userId: string | null,
  limit = 20,
  offset = 0,
): Promise<TimelineResult> {
  if (!userId) return { data: [], error: null };

  const safeLimit = Number.isSafeInteger(limit) && limit > 0 ? Math.min(limit, 100) : 20;
  const safeOffset = Number.isSafeInteger(offset) && offset >= 0 ? offset : 0;
  const { data, error } = await client.rpc('get_timeline_posts', {
    p_user_id: userId,
    p_limit: safeLimit,
    p_offset: safeOffset,
  });
  if (error) return { data: [], error };
  const rows = (data ?? []) as PostRow[];
  if (!rows.length) return { data: [], error: null };

  // The legacy SECURITY DEFINER RPC bypasses RLS and omits page_id. Check
  // positively against the caller's visible rows before rendering or hydrating
  // any returned content. Unlike a deny-list, this also fails closed when RLS
  // hides a row or the visibility read fails. Keep this until the separately
  // reviewed database hardening is deployed and verified on every environment.
  const { data: visible, error: visibilityError } = await client
    .from('posts')
    .select('id')
    .in('id', rows.map((row) => row.id))
    .is('blog_id', null)
    .is('page_id', null);
  if (visibilityError) return { data: [], error: visibilityError };

  const visibleIds = new Set((visible ?? []).map((row: { id: string }) => row.id));
  const allowed = rows.filter((row) => visibleIds.has(row.id));
  if (!allowed.length) return { data: [], error: null };

  const [profiles, reactions] = await Promise.all([
    loadProfilesForPosts(client, allowed),
    loadMyReactions(client, allowed.map((row) => row.id), userId),
  ]);
  return {
    data: allowed.map((row) => mapPost(row, profiles, reactions.get(row.id) ?? null)),
    error: null,
  };
}
