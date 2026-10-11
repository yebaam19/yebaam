import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getServerClient } from '@/utils/supabase/server';
import { getPublicServerClient } from '@/utils/supabase/public-server';
import type {
  MusicMediaAlbumRef,
  MusicMediaArtistRef,
  MusicMediaClubRef,
  MusicMediaItem,
} from '../types/music-media.types';

type SessionClient = Awaited<ReturnType<typeof getServerClient>>;

type BaseRow = {
  id: string;
  kind: 'photo' | 'video';
  source: 'cf_image' | 'cf_stream' | 'embed';
  cf_image_id: string | null;
  cf_stream_uid: string | null;
  embed_url: string | null;
  embed_provider: 'youtube' | 'vimeo' | null;
  thumbnail_cf_image_id: string | null;
  caption: string | null;
  duration_seconds: number | null;
  uploaded_by: string | null;
  created_at: string;
};

const BASE_SELECT =
  'id, kind, source, cf_image_id, cf_stream_uid, embed_url, embed_provider, thumbnail_cf_image_id, caption, duration_seconds, uploaded_by, created_at';

export const MUSIC_MEDIA_CACHE_TAG = 'public-music-media';

const loadLatestMediaRows = unstable_cache(async (limit: number): Promise<BaseRow[]> => {
  const { data, error } = await getPublicServerClient()
    .from('music_media')
    .select(BASE_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as BaseRow[];
}, ['public-music-media-v1'], { revalidate: 60, tags: [MUSIC_MEDIA_CACHE_TAG] });

/** Read each pivot and its visible parent labels together. Inner joins preserve
 *  the old behavior of omitting associations hidden by parent-table RLS. */
async function loadAssociations(
  client: SessionClient,
  mediaIds: string[],
): Promise<{
  artistsByMediaId: Map<string, MusicMediaArtistRef[]>;
  albumsByMediaId: Map<string, MusicMediaAlbumRef[]>;
  clubsByMediaId: Map<string, MusicMediaClubRef[]>;
}> {
  const empty = {
    artistsByMediaId: new Map<string, MusicMediaArtistRef[]>(),
    albumsByMediaId: new Map<string, MusicMediaAlbumRef[]>(),
    clubsByMediaId: new Map<string, MusicMediaClubRef[]>(),
  };
  if (mediaIds.length === 0) return empty;

  const [artists, albums, clubs] = await Promise.all([
    client.from('music_media_artists')
      .select('media_id, ref:music_artists!inner(id, name, slug)')
      .in('media_id', mediaIds),
    client.from('music_media_albums')
      .select('media_id, ref:music_albums!inner(id, title, slug)')
      .in('media_id', mediaIds),
    client.from('music_media_clubs')
      .select('media_id, ref:clubs!inner(id, name, slug)')
      .in('media_id', mediaIds),
  ]);

  return {
    artistsByMediaId: groupAssociations<MusicMediaArtistRef>(artists.data),
    albumsByMediaId: groupAssociations<MusicMediaAlbumRef>(albums.data),
    clubsByMediaId: groupAssociations<MusicMediaClubRef>(clubs.data),
  };
}

type AssociationRow<T> = { media_id: string; ref: T | T[] | null };

function groupAssociations<T>(data: unknown): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of (data ?? []) as AssociationRow<T>[]) {
    const ref = Array.isArray(row.ref) ? row.ref[0] : row.ref;
    if (!ref) continue;
    const refs = grouped.get(row.media_id) ?? [];
    refs.push(ref);
    grouped.set(row.media_id, refs);
  }
  return grouped;
}

function hydrate(
  base: BaseRow,
  artists: MusicMediaArtistRef[],
  albums: MusicMediaAlbumRef[],
  clubs: MusicMediaClubRef[],
): MusicMediaItem {
  return {
    ...base,
    artists,
    albums,
    clubs,
  };
}

async function hydrateRows(
  client: SessionClient,
  rows: BaseRow[],
): Promise<MusicMediaItem[]> {
  const ids = rows.map((r) => r.id);
  const { artistsByMediaId, albumsByMediaId, clubsByMediaId } = await loadAssociations(client, ids);
  return rows.map((r) =>
    hydrate(
      r,
      artistsByMediaId.get(r.id) ?? [],
      albumsByMediaId.get(r.id) ?? [],
      clubsByMediaId.get(r.id) ?? [],
    ),
  );
}

/** Latest media items across the whole archive, regardless of association.
 *  Used by /musica. */
export const listLatestMusicMedia = cache(
  async (limit = 24): Promise<MusicMediaItem[]> => {
    let rows: BaseRow[];
    try {
      rows = await loadLatestMediaRows(limit);
    } catch {
      return [];
    }
    if (rows.length === 0) return [];
    return hydrateRows(await getServerClient(), rows);
  },
);

export const listMusicMediaForArtist = cache(
  async (artistId: string, limit = 60): Promise<MusicMediaItem[]> => {
    const client = await getServerClient();
    const { data: pivots } = await client
      .from('music_media_artists')
      .select('media_id')
      .eq('artist_id', artistId)
      .limit(limit);
    const mediaIds = ((pivots ?? []) as Array<{ media_id: string }>).map((p) => p.media_id);
    if (mediaIds.length === 0) return [];
    const { data } = await client
      .from('music_media')
      .select(BASE_SELECT)
      .in('id', mediaIds)
      .order('created_at', { ascending: false });
    return hydrateRows(client, (data ?? []) as BaseRow[]);
  },
);

export const listMusicMediaForAlbum = cache(
  async (albumId: string): Promise<MusicMediaItem[]> => {
    const client = await getServerClient();
    const { data: pivots } = await client
      .from('music_media_albums')
      .select('media_id')
      .eq('album_id', albumId);
    const mediaIds = ((pivots ?? []) as Array<{ media_id: string }>).map((p) => p.media_id);
    if (mediaIds.length === 0) return [];
    const { data } = await client
      .from('music_media')
      .select(BASE_SELECT)
      .in('id', mediaIds)
      .order('created_at', { ascending: false });
    return hydrateRows(client, (data ?? []) as BaseRow[]);
  },
);

export const listMusicMediaForClub = cache(
  async (clubId: string, limit = 60): Promise<MusicMediaItem[]> => {
    const client = await getServerClient();
    const { data: pivots } = await client
      .from('music_media_clubs')
      .select('media_id')
      .eq('club_id', clubId)
      .limit(limit);
    const mediaIds = ((pivots ?? []) as Array<{ media_id: string }>).map((p) => p.media_id);
    if (mediaIds.length === 0) return [];
    const { data } = await client
      .from('music_media')
      .select(BASE_SELECT)
      .in('id', mediaIds)
      .order('created_at', { ascending: false });
    return hydrateRows(client, (data ?? []) as BaseRow[]);
  },
);

export const getMusicMediaById = cache(
  async (id: string): Promise<MusicMediaItem | null> => {
    const client = await getServerClient();
    const { data } = await client
      .from('music_media')
      .select(BASE_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (!data) return null;
    const hydrated = await hydrateRows(client, [data as BaseRow]);
    return hydrated[0] ?? null;
  },
);
