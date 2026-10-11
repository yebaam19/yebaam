import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import { CommunityRow } from '@/lib/api/communities';
import { Community } from '../../types/community.types';
import type { HeaderImages } from '../../schemas/communityHeaderImage.schema';
import { getViewerId, loadCommunityContext, mapRows, COMMUNITY_COLUMNS } from './_shared';

type DetailRow = CommunityRow & {
  cover_framing: HeaderImages['cover']['framing'];
  profile_framing: HeaderImages['profile']['framing'];
  header_image_version: number;
};

export const getCommunityDetailBySlug = cache(async (slug: string): Promise<{
  community: Community;
  headerImages: HeaderImages;
} | null> => {
  if (!slug) return null;
  const client = await getServerClient();
  const [viewerId, { data, error }] = await Promise.all([
    getViewerId(),
    client.from('communities').select(`${COMMUNITY_COLUMNS},cover_framing,profile_framing,header_image_version`).eq('slug', slug).maybeSingle(),
  ]);
  if (error) throw new Error('No se pudo cargar la comunidad.');
  if (!data) return null;
  const row = data as DetailRow;
  const rows = [row];
  const ctx = await loadCommunityContext(rows, viewerId);
  const community = mapRows(rows, viewerId, ctx)[0];
  if (!community) return null;
  return {
    community,
    headerImages: {
      version: row.header_image_version,
      cover: { id: row.cover_image, framing: row.cover_framing },
      profile: { id: row.profile_image, framing: row.profile_framing },
    },
  };
});

export const getCommunityBySlug = cache(async (slug: string): Promise<Community | null> =>
  (await getCommunityDetailBySlug(slug))?.community ?? null);
