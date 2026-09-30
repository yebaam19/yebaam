import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getPublicServerClient } from '@/utils/supabase/public-server';

export const MUSIC_GENRES_CACHE_TAG = 'music-genres';

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

/** Only the public taxonomy is shared across requests. The anonymous client
 * cannot contribute user-specific rows; club/member/media reads stay RLS-bound.
 * Throw inside the cache so transient failures never become cached empty lists. */
const loadPublicMusicGenres = unstable_cache(
  async (): Promise<MusicGenreRow[]> => {
    const client = getPublicServerClient();
    const { data, error } = await client.from('music_genres').select(SELECT);
    if (error) throw error;
    return (data ?? []) as MusicGenreRow[];
  },
  ['public-music-genres-v1'],
  { revalidate: 60, tags: [MUSIC_GENRES_CACHE_TAG] },
);

/** All genres, sorted alphabetically by `name` (Spanish collation). Rows with
 *  the same `sort_order` stay grouped: lower `sort_order` first, then name
 *  within the group — so admins can pin a few genres at the top (0,1,2…)
 *  while the rest share the same order value and read A–Z. Genre mutations
 *  expire the shared cache immediately; React also deduplicates per render. */
export const listMusicGenres = cache(async (): Promise<MusicGenreRow[]> => {
  let rows: MusicGenreRow[];
  try {
    rows = await loadPublicMusicGenres();
  } catch {
    return [];
  }
  return [...rows].sort((a, b) => {
    const oa = a.sort_order;
    const ob = b.sort_order;
    if (oa !== ob) return oa - ob;
    return compareGenreNames(a.name, b.name);
  });
});

export const getMusicGenreBySlug = cache(
  async (slug: string): Promise<MusicGenreRow | null> => {
    const genres = await listMusicGenres();
    return genres.find((genre) => genre.slug === slug) ?? null;
  },
);
