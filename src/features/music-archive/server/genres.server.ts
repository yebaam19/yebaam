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

function compareGenreNames(a: string, b: string): number {
  return a.localeCompare(b, 'es', { sensitivity: 'base', numeric: true });
}

/** All genres, sorted alphabetically by `name` (Spanish collation). Rows with
 *  the same `sort_order` stay grouped: lower `sort_order` first, then name
 *  within the group — so admins can pin a few genres at the top (0,1,2…)
 *  while the rest share the same order value and read A–Z. Cached per render. */
export const listMusicGenres = cache(async (): Promise<MusicGenreRow[]> => {
  const client = await getServerClient();
  const { data } = await client.from('music_genres').select(SELECT);
  const rows = (data ?? []) as MusicGenreRow[];
  return [...rows].sort((a, b) => {
    const oa = a.sort_order;
    const ob = b.sort_order;
    if (oa !== ob) return oa - ob;
    return compareGenreNames(a.name, b.name);
  });
});

export const getMusicGenreBySlug = cache(
  async (slug: string): Promise<MusicGenreRow | null> => {
    const client = await getServerClient();
    const { data } = await client.from('music_genres').select(SELECT).eq('slug', slug).maybeSingle();
    return (data as MusicGenreRow | null) ?? null;
  },
);
