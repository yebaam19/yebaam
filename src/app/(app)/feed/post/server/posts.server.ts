import 'server-only';
import { getServerClient } from '@/utils/supabase/server';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';
import { mapPost, loadProfilesForPosts, type PostRow } from '@/lib/api/posts';
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
  const profiles = await loadProfilesForPosts(client, rows);
  return rows.map((r) => mapPost(r, profiles) as unknown as Post);
}
