import 'server-only';
import { getServerClient } from '@/utils/supabase/server';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';
import { mapPost, loadProfilesForPosts, loadMyReactions, type PostRow } from '@/lib/api/posts';
import type { Post } from '../interfaces/post.interfaces';

export async function listTimelinePosts(limit = 20): Promise<Post[]> {
  const authUser = await getCachedAuthUser();
  const userId = authUser?.id;
  if (!userId) return [];

  const client = await getServerClient();

  const { data: rpcRows, error } = await client.rpc('get_timeline_posts', {
    p_user_id: userId,
    p_limit: limit,
    p_offset: 0,
  });

  if (error || !rpcRows) return [];

  const rows = rpcRows as PostRow[];

  // Ship the viewer's own reactions with the first paint. Both reads are
  // independent, so they cost one round-trip together — and it saves the client
  // a `reactions` query after hydration plus the visible flicker where every
  // Like button rendered "not liked" until that query landed.
  const [profiles, myReactions] = await Promise.all([
    loadProfilesForPosts(client, rows),
    loadMyReactions(client, rows.map((r) => r.id), userId),
  ]);

  return rows.map((r) => mapPost(r, profiles, myReactions.get(r.id) ?? null) as unknown as Post);
}
