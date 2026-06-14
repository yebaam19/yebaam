import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import type {
  MusicAlbumRow,
  MusicArtistRow,
  MusicSearchHit,
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

function normalizeSearchTrack(t: RawTrackJoin): SearchTrackResult | null {
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
}

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

    const trackRows = ((tracks ?? []) as unknown as RawTrackJoin[])
      .map<SearchTrackResult | null>((t) => normalizeSearchTrack(t))
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
