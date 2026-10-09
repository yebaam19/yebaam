import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import {
  CommunityPostRow,
  ProfileLite,
  mapPost,
} from '@/lib/api/communities';
import { CommunityPost } from '../../types/community.types';
import type { CommunityPostCursor } from '../../schemas/communityPostCursor.schema';

const POST_COLUMNS = 'id,community_id,author_id,body,media,created_at,updated_at';
const HOME_PAGE_SIZE = 10;

async function mapCommunityPostRows(
  communityId: string,
  rows: CommunityPostRow[],
  client: Awaited<ReturnType<typeof getServerClient>>,
): Promise<CommunityPost[]> {
  if (rows.length === 0) return [];
  const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
  const [{ data: profiles }, { data: communityRow }] = await Promise.all([
    client.from('profiles').select('id,username,first_name,last_name,avatar_url').in('id', authorIds),
    client.from('communities').select('slug').eq('id', communityId).maybeSingle(),
  ]);
  const profileMap = new Map<string, ProfileLite>();
  for (const p of (profiles ?? []) as ProfileLite[]) profileMap.set(p.id, p);
  const communitySlug = (communityRow as { slug: string } | null)?.slug;
  return rows.map((row) => mapPost(row, profileMap.get(row.author_id), communitySlug));
}

export const getCommunityHomePosts = cache(async (
  communityId: string,
  cursor: CommunityPostCursor | null,
): Promise<{ posts: CommunityPost[]; nextCursor: CommunityPostCursor | null }> => {
  const client = await getServerClient();
  let query = client.from('community_posts').select(POST_COLUMNS)
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(HOME_PAGE_SIZE + 1);
  if (cursor) query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error('No se pudieron cargar las publicaciones.');
  const rows = (data ?? []) as CommunityPostRow[];
  const visibleRows = rows.slice(0, HOME_PAGE_SIZE);
  const last = visibleRows.at(-1);
  return {
    posts: await mapCommunityPostRows(communityId, visibleRows, client),
    nextCursor: rows.length > HOME_PAGE_SIZE && last
      ? { createdAt: last.created_at, id: last.id } : null,
  };
});

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
    .select(POST_COLUMNS, { count: 'exact' })
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to);

  if (error) console.error('[getCommunityPosts]', error);
  const rows = (data ?? []) as CommunityPostRow[];
  return {
    posts: await mapCommunityPostRows(communityId, rows, client),
    total: count ?? rows.length,
  };
}
