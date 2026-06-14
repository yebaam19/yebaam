import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import { CommunityRow } from '@/lib/api/communities';
import { Community } from '../../types/community.types';
import { getViewerId, loadCommunityContext, mapRows, COMMUNITY_COLUMNS } from './_shared';

export const listPopularCommunities = cache(async (limit = 12): Promise<Community[]> => {
  const client = await getServerClient();
  const viewerId = await getViewerId();
  const { data } = await client
    .from('communities')
    .select(COMMUNITY_COLUMNS)
    .order('member_count', { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as CommunityRow[];
  const ctx = await loadCommunityContext(rows, viewerId);
  return mapRows(rows, viewerId, ctx);
});

export const listMyCommunities = cache(async (): Promise<Community[]> => {
  const client = await getServerClient();
  const viewerId = await getViewerId();
  if (!viewerId) return [];

  const { data: memberships } = await client
    .from('community_members')
    .select('community_id')
    .eq('user_id', viewerId)
    .eq('status', 'active');
  const ids = ((memberships ?? []) as { community_id: string }[]).map((m) => m.community_id);
  if (ids.length === 0) return [];

  const { data } = await client
    .from('communities')
    .select(COMMUNITY_COLUMNS)
    .in('id', ids)
    .order('last_activity_at', { ascending: false });
  const rows = (data ?? []) as CommunityRow[];
  const ctx = await loadCommunityContext(rows, viewerId);
  return mapRows(rows, viewerId, ctx);
});

export const listSuggestedCommunities = cache(async (limit = 12): Promise<Community[]> => {
  const client = await getServerClient();
  const viewerId = await getViewerId();

  let excludeIds: string[] = [];
  if (viewerId) {
    const { data: mine } = await client
      .from('community_members')
      .select('community_id')
      .eq('user_id', viewerId);
    excludeIds = ((mine ?? []) as { community_id: string }[]).map((m) => m.community_id);
  }

  let query = client
    .from('communities')
    .select(COMMUNITY_COLUMNS)
    .eq('privacy', 'PUBLIC')
    .order('last_activity_at', { ascending: false })
    .limit(limit);
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }
  const { data } = await query;
  const rows = (data ?? []) as CommunityRow[];
  const ctx = await loadCommunityContext(rows, viewerId);
  return mapRows(rows, viewerId, ctx);
});
