import 'server-only';
import { getServerClient } from '@/utils/supabase/server';
import { mapPost, loadProfilesForPosts, type PostRow } from '@/lib/api/posts';
import type { Post } from '../interfaces/post.interfaces';

export async function listTimelinePosts(limit = 20): Promise<Post[]> {
  const client = await getServerClient();

  const { data: auth } = await client.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return [];

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
