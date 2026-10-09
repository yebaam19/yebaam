import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { getServerClient } from '@/utils/supabase/server';
import type { CommunityTopTab } from '../types/communityTopTab.types';

export const getCommunityTopTabs = cache(async (communityId: string): Promise<CommunityTopTab[]> => {
  z.uuid().parse(communityId);
  const client = await getServerClient();
  const { data, error } = await client.from('community_top_tabs')
    .select('tab_key,title,position,is_visible,version')
    .eq('community_id', communityId).order('position').limit(6);
  if (error) throw new Error('No se pudieron cargar las pestañas.');
  return (data ?? []) as CommunityTopTab[];
});
