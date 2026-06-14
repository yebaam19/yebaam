import 'server-only';
import { getServerClient } from '@/utils/supabase/server';
import {
  CommunityPostRow,
  ProfileLite,
  mapPost,
} from '@/lib/api/communities';
import { CommunityPost } from '../../types/community.types';

export async function getCommunityPosts(
  communityId: string,
  opts: { page?: number; limit?: number } = {},
): Promise<{ posts: CommunityPost[]; total: number }> {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const client = await getServerClient();
  const { data, count, error } = await client
    .from('community_posts')
    .select('id,community_id,author_id,body,media,created_at,updated_at', { count: 'exact' })
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) console.error('[getCommunityPosts]', error);
  const rows = (data ?? []) as CommunityPostRow[];
  if (rows.length === 0) return { posts: [], total: count ?? 0 };

  const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
  const [{ data: profiles }, { data: communityRow }] = await Promise.all([
    client
      .from('profiles')
      .select('id,username,first_name,last_name,avatar_url')
      .in('id', authorIds),
    client.from('communities').select('slug').eq('id', communityId).maybeSingle(),
  ]);
  const profileMap = new Map<string, ProfileLite>();
  for (const p of (profiles ?? []) as ProfileLite[]) profileMap.set(p.id, p);
  const communitySlug = (communityRow as { slug: string } | null)?.slug;

  return {
    posts: rows.map((row) => mapPost(row, profileMap.get(row.author_id), communitySlug)),
    total: count ?? rows.length,
  };
}
