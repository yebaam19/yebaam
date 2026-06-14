import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import { CommunityRow } from '@/lib/api/communities';
import { Community } from '../../types/community.types';
import { getViewerId, loadCommunityContext, mapRows, COMMUNITY_COLUMNS } from './_shared';

export const getCommunityBySlug = cache(async (slug: string): Promise<Community | null> => {
  if (!slug) return null;
  const client = await getServerClient();
  const viewerId = await getViewerId();
  const { data } = await client
    .from('communities')
    .select(COMMUNITY_COLUMNS)
    .eq('slug', slug)
    .maybeSingle();
  if (!data) return null;
  const rows = [data as CommunityRow];
  const ctx = await loadCommunityContext(rows, viewerId);
  return mapRows(rows, viewerId, ctx)[0] ?? null;
});
