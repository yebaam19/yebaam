import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import { listMusicClubs } from './clubs/metadata.server';
import type { MusicAlbumRow } from '../types/music.types';

/** Genre-filtered albums reuse the club list already needed by /musica.
 * This avoids a genre lookup and a second club lookup on every filtered view. */
export const listAlbumsFiltered = cache(async (opts: {
  decade?: number;
  country?: string;
  forTrade?: boolean;
  genreSlug?: string;
  condition?: string;
  limit?: number;
}): Promise<MusicAlbumRow[]> => {
  const client = await getServerClient();
  let allowedIds: string[] | null = null;

  if (opts.genreSlug) {
    const clubIds = (await listMusicClubs())
      .filter((club) => club.genre_slug === opts.genreSlug)
      .map((club) => club.id);
    if (clubIds.length === 0) return [];
    const { data: pivots, error } = await client.from('music_album_clubs')
      .select('album_id').in('club_id', clubIds);
    if (error) return [];
    allowedIds = Array.from(new Set((pivots ?? []).map((row) => row.album_id)));
    if (allowedIds.length === 0) return [];
  }

  let query = client.from('music_albums').select('*');
  if (opts.decade !== undefined) query = query.gte('year', opts.decade).lt('year', opts.decade + 10);
  if (opts.country) query = query.eq('country', opts.country);
  if (opts.forTrade) query = query.eq('for_trade', true);
  if (opts.condition) query = query.eq('condition', opts.condition);
  if (allowedIds) query = query.in('id', allowedIds);
  const { data } = await query.order('year', { ascending: true, nullsFirst: false })
    .limit(opts.limit ?? 60);
  return (data as MusicAlbumRow[] | null) ?? [];
});
