import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import type {
  AlbumWithDetails,
  ArtistWithDiscography,
  LabelWithDiscography,
  MusicAlbumRow,
  MusicArtistRow,
  MusicLabelRow,
  MusicSearchHit,
  MusicTrackCreditRow,
  MusicTrackRow,
} from '../types/music.types';

export { searchMusic, searchMusicTopHits } from './music-search.server';
export type { SearchTrackResult, MusicSearchResult } from './music-search.server';

export type { MusicSearchHit };

export const listLatestAlbums = cache(async (limit = 24): Promise<MusicAlbumRow[]> => {
  const client = await getServerClient();
  const { data } = await client
    .from('music_albums')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data as MusicAlbumRow[] | null) ?? [];
});

export const listAlbumsFiltered = cache(
  async (opts: {
    decade?: number;
    country?: string;
    forTrade?: boolean;
    /** music_genres.slug — filter by albums tagged to a club whose genre
     *  matches. Uses `music_album_clubs` pivot. */
    genreSlug?: string;
    condition?: string;
    limit?: number;
  }): Promise<MusicAlbumRow[]> => {
    const client = await getServerClient();

    // Pre-resolve the genre filter into an album id allow-list. Cheap because
    // music_album_clubs is small relative to music_albums and avoids a join
    // that pulls duplicate rows.
    let allowedIds: string[] | null = null;
    if (opts.genreSlug) {
      const { data: g } = await client
        .from('music_genres')
        .select('id')
        .eq('slug', opts.genreSlug)
        .maybeSingle();
      const genreId = (g as { id: string } | null)?.id;
      if (!genreId) return [];
      const { data: clubs } = await client
        .from('clubs')
        .select('id')
        .eq('music_genre_id', genreId);
      const clubIds = ((clubs ?? []) as Array<{ id: string }>).map((c) => c.id);
      if (clubIds.length === 0) return [];
      const { data: pivots } = await client
        .from('music_album_clubs')
        .select('album_id')
        .in('club_id', clubIds);
      allowedIds = Array.from(
        new Set(((pivots ?? []) as Array<{ album_id: string }>).map((p) => p.album_id)),
      );
      if (allowedIds.length === 0) return [];
    }

    let q = client.from('music_albums').select('*');
    if (opts.decade !== undefined) {
      q = q.gte('year', opts.decade).lt('year', opts.decade + 10);
    }
    if (opts.country) {
      q = q.eq('country', opts.country);
    }
    if (opts.forTrade) {
      q = q.eq('for_trade', true);
    }
    if (opts.condition) {
      q = q.eq('condition', opts.condition);
    }
    if (allowedIds) {
      q = q.in('id', allowedIds);
    }
    const { data } = await q
      .order('year', { ascending: true, nullsFirst: false })
      .limit(opts.limit ?? 60);
    return (data as MusicAlbumRow[] | null) ?? [];
  },
);

export const getAlbumBySlug = cache(async (slug: string): Promise<AlbumWithDetails | null> => {
  const client = await getServerClient();
  const { data: album } = await client
    .from('music_albums')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (!album) return null;
  const a = album as MusicAlbumRow;

  const [{ data: artist }, { data: label }, { data: tracks }] = await Promise.all([
    client
      .from('music_artists')
      .select('id, name, slug, photo_cf_image_id')
      .eq('id', a.artist_id)
      .maybeSingle(),
    a.label_id
      ? client.from('music_labels').select('id, name, slug').eq('id', a.label_id).maybeSingle()
      : Promise.resolve({ data: null }),
    client
      .from('music_tracks')
      .select('*')
      .eq('album_id', a.id)
      .order('side', { ascending: true, nullsFirst: true })
      .order('position', { ascending: true }),
  ]);

  const trackRows = (tracks as MusicTrackRow[] | null) ?? [];
  const trackIds = trackRows.map((t) => t.id);

  let credits: MusicTrackCreditRow[] = [];
  if (trackIds.length > 0) {
    const { data: creditRows } = await client
      .from('music_track_credits')
      .select('*')
      .in('track_id', trackIds);
    credits = (creditRows as MusicTrackCreditRow[] | null) ?? [];
  }

  const creditsByTrack = new Map<string, MusicTrackCreditRow[]>();
  for (const c of credits) {
    const arr = creditsByTrack.get(c.track_id) ?? [];
    arr.push(c);
    creditsByTrack.set(c.track_id, arr);
  }

  return {
    ...a,
    artist: (artist as AlbumWithDetails['artist']) ?? {
      id: a.artist_id,
      name: 'Desconocido',
      slug: '',
      photo_cf_image_id: null,
    },
    label: (label as AlbumWithDetails['label']) ?? null,
    tracks: trackRows.map((t) => ({ ...t, credits: creditsByTrack.get(t.id) ?? [] })),
  };
});

export const getArtistBySlug = cache(async (slug: string): Promise<ArtistWithDiscography | null> => {
  const client = await getServerClient();
  const { data: artist } = await client
    .from('music_artists')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (!artist) return null;
  const a = artist as MusicArtistRow;

  const { data: albums } = await client
    .from('music_albums')
    .select('*')
    .eq('artist_id', a.id)
    .order('year', { ascending: true, nullsFirst: false });

  return { ...a, albums: (albums as MusicAlbumRow[] | null) ?? [] };
});

export const getLabelBySlug = cache(async (slug: string): Promise<LabelWithDiscography | null> => {
  const client = await getServerClient();
  const { data: label } = await client
    .from('music_labels')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (!label) return null;
  const l = label as MusicLabelRow;

  const { data: albums } = await client
    .from('music_albums')
    .select('*')
    .eq('label_id', l.id)
    .order('year', { ascending: true, nullsFirst: false });

  return { ...l, albums: (albums as MusicAlbumRow[] | null) ?? [] };
});

export const searchArtists = cache(
  async (q: string, limit = 20): Promise<MusicArtistRow[]> => {
    const trimmed = q.trim();
    if (!trimmed) return [];
    const client = await getServerClient();
    const { data } = await client
      .from('music_artists')
      .select('*')
      .ilike('name', `%${trimmed}%`)
      .limit(limit);
    return (data as MusicArtistRow[] | null) ?? [];
  },
);

export const searchAlbumsByArtist = cache(
  async (artistId: string, q: string, limit = 20): Promise<MusicAlbumRow[]> => {
    const trimmed = q.trim();
    const client = await getServerClient();
    let query = client.from('music_albums').select('*').eq('artist_id', artistId);
    if (trimmed) query = query.ilike('title', `%${trimmed}%`);
    const { data } = await query.limit(limit);
    return (data as MusicAlbumRow[] | null) ?? [];
  },
);

export const searchLabels = cache(async (q: string, limit = 20): Promise<MusicLabelRow[]> => {
  const trimmed = q.trim();
  if (!trimmed) return [];
  const client = await getServerClient();
  const { data } = await client
    .from('music_labels')
    .select('*')
    .ilike('name', `%${trimmed}%`)
    .limit(limit);
  return (data as MusicLabelRow[] | null) ?? [];
});

// ─────────────────────────────────────────────────────────────────────────────
// Platform-admin gate. Reuses the existing `platform_admins` table.

export async function requirePlatformAdmin(): Promise<{
  userId: string;
  client: SupabaseClient;
} | null> {
  const client = await getServerClient();
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) return null;
  const { data: admin } = await client
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (!admin) return null;
  return { userId: userData.user.id, client };
}
