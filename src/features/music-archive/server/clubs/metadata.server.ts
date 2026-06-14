import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import {
  CLUB_SELECT,
  mapClubRow,
  type ClubRowRaw,
} from './club-shape.helpers';

export interface MusicClubRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  music_genre_id: string;
  /** Slug from the joined `music_genres` row. Kept flat for the legacy
   *  `music_genre` field — UI code that used to do `genre.replace(/_/g, ' ')`
   *  can just read `genre_name` now. */
  genre_slug: string;
  genre_name: string;
  cover_image_url: string | null;
  profile_image_url: string | null;
  album_count: number;
  member_count: number;
}

/** Lookup of every genre-club + its album count + its member count.
 *  Ordered by album count desc so the densest clubs lead. `react.cache()` so
 *  the same render doesn't double-query. */
export const listMusicClubs = cache(async (): Promise<MusicClubRow[]> => {
  const client = await getServerClient();
  const { data: clubs, error } = await client
    .from('clubs')
    .select(CLUB_SELECT)
    .eq('category', 'MUSICA')
    .not('music_genre_id', 'is', null)
    .order('name', { ascending: true });
  if (error || !clubs) return [];
  const rows = clubs as unknown as ClubRowRaw[];

  const clubIds = rows.map((r) => r.id);
  if (clubIds.length === 0) return [];

  // Album + member counts in two batched queries; saves N+1.
  const [{ data: albumRows }, { data: memberRows }] = await Promise.all([
    client.from('music_album_clubs').select('club_id').in('club_id', clubIds),
    client.from('club_members').select('club_id').in('club_id', clubIds),
  ]);

  const albumCount = new Map<string, number>();
  for (const r of (albumRows ?? []) as Array<{ club_id: string }>) {
    albumCount.set(r.club_id, (albumCount.get(r.club_id) ?? 0) + 1);
  }
  const memberCount = new Map<string, number>();
  for (const r of (memberRows ?? []) as Array<{ club_id: string }>) {
    memberCount.set(r.club_id, (memberCount.get(r.club_id) ?? 0) + 1);
  }

  return rows
    .map((r) =>
      mapClubRow(r, {
        albumCount: albumCount.get(r.id) ?? 0,
        memberCount: memberCount.get(r.id) ?? 0,
      }),
    )
    .sort((a, b) => b.album_count - a.album_count || a.name.localeCompare(b.name));
});

export const getMusicClubBySlug = cache(async (slug: string): Promise<MusicClubRow | null> => {
  const client = await getServerClient();
  const { data: club } = await client
    .from('clubs')
    .select(CLUB_SELECT)
    .eq('category', 'MUSICA')
    .eq('slug', slug)
    .maybeSingle();
  if (!club) return null;
  const c = club as unknown as ClubRowRaw;

  const [{ count: albumCount }, { count: memberCount }] = await Promise.all([
    client
      .from('music_album_clubs')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', c.id),
    client
      .from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', c.id),
  ]);

  return mapClubRow(c, {
    albumCount: albumCount ?? 0,
    memberCount: memberCount ?? 0,
  });
});

/** All clubs an album is tagged into. Used by the album detail page for the
 *  small genre chips below the metadata grid. */
export const listClubsForAlbum = cache(
  async (albumId: string): Promise<Array<{ id: string; name: string; slug: string; is_primary: boolean }>> => {
    const client = await getServerClient();
    const { data } = await client
      .from('music_album_clubs')
      .select('is_primary, clubs!inner(id, name, slug)')
      .eq('album_id', albumId);
    type Row = {
      is_primary: boolean;
      clubs: { id: string; name: string; slug: string } | Array<{ id: string; name: string; slug: string }>;
    };
    return ((data as unknown as Row[] | null) ?? [])
      .map((r) => {
        const c = Array.isArray(r.clubs) ? r.clubs[0] : r.clubs;
        return c ? { ...c, is_primary: r.is_primary } : null;
      })
      .filter((x): x is { id: string; name: string; slug: string; is_primary: boolean } => x !== null)
      .sort((a, b) => (a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1));
  },
);
