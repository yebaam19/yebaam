import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { getServerClient } from '@/utils/supabase/server';
import type { CommunityTopTab, CommunityTopTabConfig } from '../types/communityTopTab.types';

export const getCommunityTopTabs = cache(async (communityId: string): Promise<CommunityTopTabConfig> => {
  z.uuid().parse(communityId);
  const client = await getServerClient();
  const [rows, state] = await Promise.all([
    client.from('community_top_tabs').select('tab_key,title,position,is_visible,version')
      .eq('community_id', communityId).order('position').limit(6),
    client.rpc('community_top_tabs_configured', { target_community: communityId }),
  ]);
  if (rows.error || state.error) throw new Error('No se pudieron cargar las pestañas.');
  return { items: (rows.data ?? []) as CommunityTopTab[], configured: state.data === true };
});
