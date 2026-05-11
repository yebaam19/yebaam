import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';

export interface MusicGenreRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_cf_id: string | null;
  sort_order: number;
}

const SELECT = 'id, slug, name, description, image_cf_id, sort_order';

/** All genres, sorted by `sort_order` then `name`. Cached per render so the
 *  same RSC tree doesn't refetch. The catalogue is small (~20 rows) so we
 *  always fetch the full list — caller can filter in memory. */
export const listMusicGenres = cache(async (): Promise<MusicGenreRow[]> => {
  const client = await getServerClient();
  const { data } = await client
    .from('music_genres')
    .select(SELECT)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  return (data ?? []) as MusicGenreRow[];
});

export const getMusicGenreBySlug = cache(
  async (slug: string): Promise<MusicGenreRow | null> => {
    const client = await getServerClient();
    const { data } = await client.from('music_genres').select(SELECT).eq('slug', slug).maybeSingle();
    return (data as MusicGenreRow | null) ?? null;
  },
);
