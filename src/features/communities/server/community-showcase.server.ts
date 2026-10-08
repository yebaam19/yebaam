import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { getServerClient } from '@/utils/supabase/server';
import type { CommunityShowcase, ShowcaseVideo } from '../types/communityShowcase.types';
import { ASSET_COLUMNS } from './community-library.server';

/** Caller-scoped request cache only; drafts and private assets never enter a shared cache. */
export const getCommunityShowcase = cache(async (communityId: string): Promise<CommunityShowcase | null> => {
  z.uuid().parse(communityId);
  const client = await getServerClient();
  const { data, error } = await client.from('community_showcases')
    .select(`id,community_id,introduction,is_published,version,videos:community_showcase_videos(id,community_id,asset_id,position,asset:community_library_assets(${ASSET_COLUMNS},deleted_at))`)
    .eq('community_id', communityId).maybeSingle();
  if (error) throw new Error('No se pudo cargar la presentación de la comunidad.');
  if (!data) return null;
  const row = data as unknown as CommunityShowcase;
  const videos = row.videos.map((video) => {
    const asset = video.asset as (NonNullable<ShowcaseVideo['asset']> & { deleted_at?: string | null }) | null;
    if (!asset || asset.deleted_at) return { ...video, asset: null };
    const readableAsset = { ...asset };
    delete readableAsset.deleted_at;
    return { ...video, asset: readableAsset };
  }).sort((a, b) => a.position - b.position);
  return { ...row, videos };
});
