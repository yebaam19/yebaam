import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import type { HeaderImages } from '../schemas/communityHeaderImage.schema';

/** Caller-scoped cache: the same community RLS controls identity image IDs and framing. */
export const getCommunityHeaderImages = cache(async (communityId: string): Promise<HeaderImages | null> => {
  const client = await getServerClient();
  const { data, error } = await client.from('communities')
    .select('cover_image,profile_image,cover_framing,profile_framing,header_image_version')
    .eq('id', communityId).maybeSingle();
  if (error) throw new Error('No se pudieron cargar las imágenes de la comunidad.');
  if (!data) return null;
  return { version: data.header_image_version,
    cover: { id: data.cover_image, framing: data.cover_framing },
    profile: { id: data.profile_image, framing: data.profile_framing } };
});
