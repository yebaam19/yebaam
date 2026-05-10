import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import type { MusicAlbumRow } from '../types/music.types';

export interface MusicClubRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  music_genre: string;
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
    .select('id, name, slug, description, music_genre, cover_image_url, profile_image_url')
    .eq('category', 'MUSICA')
    .not('music_genre', 'is', null)
    .order('name', { ascending: true });
  if (error || !clubs) return [];
  type Row = {
    id: string;
    name: string;
    slug: string;
    description: string;
    music_genre: string;
    cover_image_url: string | null;
    profile_image_url: string | null;
  };
  const rows = clubs as Row[];

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
    .map((r) => ({
      ...r,
      album_count: albumCount.get(r.id) ?? 0,
      member_count: memberCount.get(r.id) ?? 0,
    }))
    .sort((a, b) => b.album_count - a.album_count || a.name.localeCompare(b.name));
});

export const getMusicClubBySlug = cache(async (slug: string): Promise<MusicClubRow | null> => {
  const client = await getServerClient();
  const { data: club } = await client
    .from('clubs')
    .select('id, name, slug, description, music_genre, cover_image_url, profile_image_url')
    .eq('category', 'MUSICA')
    .eq('slug', slug)
    .maybeSingle();
  if (!club) return null;
  const c = club as Omit<MusicClubRow, 'album_count' | 'member_count'>;

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

  return {
    ...c,
    album_count: albumCount ?? 0,
    member_count: memberCount ?? 0,
  };
});

export interface AlbumForClub extends MusicAlbumRow {
  is_primary: boolean;
  artist_name: string;
  artist_slug: string;
}

/** Albums tagged to this club. Primary genre first, then chronological. */
export const listAlbumsForClub = cache(async (clubId: string): Promise<AlbumForClub[]> => {
  const client = await getServerClient();
  const { data, error } = await client
    .from('music_album_clubs')
    .select(
      'is_primary, music_albums!inner(*, music_artists!inner(name, slug))',
    )
    .eq('club_id', clubId)
    .order('is_primary', { ascending: false });
  if (error || !data) return [];

  type Row = {
    is_primary: boolean;
    music_albums:
      | (MusicAlbumRow & { music_artists: { name: string; slug: string } | Array<{ name: string; slug: string }> })
      | Array<MusicAlbumRow & { music_artists: { name: string; slug: string } | Array<{ name: string; slug: string }> }>;
  };
  const rows = data as unknown as Row[];

  return rows
    .map<AlbumForClub | null>((r) => {
      const alb = Array.isArray(r.music_albums) ? r.music_albums[0] : r.music_albums;
      if (!alb) return null;
      const artist = Array.isArray(alb.music_artists) ? alb.music_artists[0] : alb.music_artists;
      return {
        ...(alb as MusicAlbumRow),
        is_primary: r.is_primary,
        artist_name: artist?.name ?? 'Desconocido',
        artist_slug: artist?.slug ?? '',
      };
    })
    .filter((a): a is AlbumForClub => a !== null)
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return (a.year ?? 0) - (b.year ?? 0);
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
