import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { getServerClient } from '@/utils/supabase/server';
import type { CommunityTheme } from '../types/communityTheme.types';

export const getCommunityTheme = cache(async (communityId: string): Promise<CommunityTheme> => {
  z.uuid().parse(communityId);
  const client = await getServerClient();
  const { data, error } = await client.from('community_profile_theme')
    .select('id,community_id,primary_color,secondary_color,version')
    .eq('community_id', communityId).maybeSingle();
  if (error) throw new Error('No se pudo cargar la presentación de la comunidad.');
  return {
    id: data?.id ?? null,
    community_id: communityId,
    primary_color: data?.primary_color === 'forest' ? 'forest' : 'green',
    secondary_color: data?.secondary_color === 'amber' ? 'amber' : 'gold',
    version: data?.version ?? 0,
  };
});
