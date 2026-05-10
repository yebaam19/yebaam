import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import type {
  AlbumWithDetails,
  ArtistWithDiscography,
  MusicAlbumRow,
  MusicArtistRow,
  MusicLabelRow,
  MusicSearchHit,
  MusicTrackCreditRow,
  MusicTrackRow,
} from '../types/music.types';

export interface SearchTrackResult extends MusicTrackRow {
  album_title: string;
  album_slug: string;
  album_cover_cf_image_id: string | null;
  artist_id: string;
  artist_name: string;
  artist_slug: string;
}

export interface MusicSearchResult {
  artists: MusicArtistRow[];
  albums: MusicAlbumRow[];
  tracks: SearchTrackResult[];
}

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

export const listAlbumsByDecade = cache(async (decade: number): Promise<MusicAlbumRow[]> => {
  const client = await getServerClient();
  const { data } = await client
    .from('music_albums')
    .select('*')
    .gte('year', decade)
    .lt('year', decade + 10)
    .order('year', { ascending: true });
  return (data as MusicAlbumRow[] | null) ?? [];
});

export const listAlbumsByCountry = cache(async (country: string): Promise<MusicAlbumRow[]> => {
  const client = await getServerClient();
  const { data } = await client
    .from('music_albums')
    .select('*')
    .eq('country', country)
    .order('year', { ascending: true });
  return (data as MusicAlbumRow[] | null) ?? [];
});

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
// Combined search across artists / albums / tracks (ILIKE for MVP, tsvector
// in a later sprint when the catalog is large enough to feel slow).

export const searchMusic = cache(
  async (q: string, limit = 12): Promise<MusicSearchResult> => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return { artists: [], albums: [], tracks: [] };
    const client = await getServerClient();
    const pattern = `%${trimmed}%`;

    const [{ data: artists }, { data: albums }, { data: tracks }] = await Promise.all([
      client
        .from('music_artists')
        .select('*')
        .ilike('name', pattern)
        .limit(limit),
      client
        .from('music_albums')
        .select('*')
        .ilike('title', pattern)
        .limit(limit),
      client
        .from('music_tracks')
        .select(
          'id, album_id, position, side, title, duration_seconds, r2_key, format, bitrate_kbps, source_media, copyright_status, contributor_attestation, contributed_by, restored_by_note, play_count, created_at, music_albums!inner(id, title, slug, cover_cf_image_id, artist_id, music_artists!inner(id, name, slug))',
        )
        .ilike('title', pattern)
        .limit(limit),
    ]);

    type RawTrackJoin = MusicTrackRow & {
      music_albums:
        | {
            id: string;
            title: string;
            slug: string;
            cover_cf_image_id: string | null;
            artist_id: string;
            music_artists:
              | { id: string; name: string; slug: string }
              | Array<{ id: string; name: string; slug: string }>;
          }
        | Array<{
            id: string;
            title: string;
            slug: string;
            cover_cf_image_id: string | null;
            artist_id: string;
            music_artists:
              | { id: string; name: string; slug: string }
              | Array<{ id: string; name: string; slug: string }>;
          }>;
    };
    const trackRows = ((tracks ?? []) as unknown as RawTrackJoin[])
      .map<SearchTrackResult | null>((t) => {
        const album = Array.isArray(t.music_albums) ? t.music_albums[0] : t.music_albums;
        if (!album) return null;
        const artist = Array.isArray(album.music_artists)
          ? album.music_artists[0]
          : album.music_artists;
        if (!artist) return null;
        return {
          ...t,
          album_title: album.title,
          album_slug: album.slug,
          album_cover_cf_image_id: album.cover_cf_image_id,
          artist_id: album.artist_id,
          artist_name: artist.name,
          artist_slug: artist.slug,
        };
      })
      .filter((t): t is SearchTrackResult => t !== null);

    return {
      artists: (artists as MusicArtistRow[] | null) ?? [],
      albums: (albums as MusicAlbumRow[] | null) ?? [],
      tracks: trackRows,
    };
  },
);

/** Lightweight top-hits across artists + albums + tracks for the autocomplete
 *  dropdown in the hero search bar. Returns up to `limit` (default 8) rows. */
export const searchMusicTopHits = cache(
  async (q: string, limit = 8): Promise<MusicSearchHit[]> => {
    const result = await searchMusic(q, Math.ceil(limit / 2));
    const hits: MusicSearchHit[] = [];
    for (const a of result.artists.slice(0, 3)) {
      hits.push({
        type: 'artist',
        id: a.id,
        label: a.name,
        sublabel: a.country,
        href: `/musica/artistas/${a.slug}`,
      });
    }
    for (const al of result.albums.slice(0, 3)) {
      hits.push({
        type: 'album',
        id: al.id,
        label: al.title,
        sublabel: al.year ? String(al.year) : null,
        href: `/musica/albumes/${al.slug}`,
      });
    }
    for (const t of result.tracks.slice(0, 3)) {
      hits.push({
        type: 'track',
        id: t.id,
        label: t.title,
        sublabel: `${t.artist_name} · ${t.album_title}`,
        href: `/musica/albumes/${t.album_slug}`,
      });
    }
    return hits.slice(0, limit);
  },
);

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
