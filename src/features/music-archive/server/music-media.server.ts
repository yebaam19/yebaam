import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import type {
  MusicMediaAlbumRef,
  MusicMediaArtistRef,
  MusicMediaClubRef,
  MusicMediaItem,
} from '../types/music-media.types';

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

/** Batch-load the three pivots + their parent labels for a set of media ids.
 *  Avoids N+1 — one query per pivot, then a single fetch for each lookup
 *  table. Returns three maps keyed by media id. */
async function loadAssociations(
  client: SupabaseClient,
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

  const [artistPivots, albumPivots, clubPivots] = await Promise.all([
    client.from('music_media_artists').select('media_id, artist_id').in('media_id', mediaIds),
    client.from('music_media_albums').select('media_id, album_id').in('media_id', mediaIds),
    client.from('music_media_clubs').select('media_id, club_id').in('media_id', mediaIds),
  ]);

  const artistRows = (artistPivots.data ?? []) as Array<{ media_id: string; artist_id: string }>;
  const albumRows = (albumPivots.data ?? []) as Array<{ media_id: string; album_id: string }>;
  const clubRows = (clubPivots.data ?? []) as Array<{ media_id: string; club_id: string }>;

  const artistIds = Array.from(new Set(artistRows.map((r) => r.artist_id)));
  const albumIds = Array.from(new Set(albumRows.map((r) => r.album_id)));
  const clubIds = Array.from(new Set(clubRows.map((r) => r.club_id)));

  const [artistRes, albumRes, clubRes] = await Promise.all([
    artistIds.length > 0
      ? client.from('music_artists').select('id, name, slug').in('id', artistIds)
      : Promise.resolve({ data: [] as Array<MusicMediaArtistRef> }),
    albumIds.length > 0
      ? client.from('music_albums').select('id, title, slug').in('id', albumIds)
      : Promise.resolve({ data: [] as Array<MusicMediaAlbumRef> }),
    clubIds.length > 0
      ? client.from('clubs').select('id, name, slug').in('id', clubIds)
      : Promise.resolve({ data: [] as Array<MusicMediaClubRef> }),
  ]);

  const artistById = new Map<string, MusicMediaArtistRef>();
  for (const a of (artistRes.data ?? []) as MusicMediaArtistRef[]) artistById.set(a.id, a);
  const albumById = new Map<string, MusicMediaAlbumRef>();
  for (const a of (albumRes.data ?? []) as MusicMediaAlbumRef[]) albumById.set(a.id, a);
  const clubById = new Map<string, MusicMediaClubRef>();
  for (const c of (clubRes.data ?? []) as MusicMediaClubRef[]) clubById.set(c.id, c);

  const artistsByMediaId = new Map<string, MusicMediaArtistRef[]>();
  for (const r of artistRows) {
    const ref = artistById.get(r.artist_id);
    if (!ref) continue;
    const list = artistsByMediaId.get(r.media_id) ?? [];
    list.push(ref);
    artistsByMediaId.set(r.media_id, list);
  }
  const albumsByMediaId = new Map<string, MusicMediaAlbumRef[]>();
  for (const r of albumRows) {
    const ref = albumById.get(r.album_id);
    if (!ref) continue;
    const list = albumsByMediaId.get(r.media_id) ?? [];
    list.push(ref);
    albumsByMediaId.set(r.media_id, list);
  }
  const clubsByMediaId = new Map<string, MusicMediaClubRef[]>();
  for (const r of clubRows) {
    const ref = clubById.get(r.club_id);
    if (!ref) continue;
    const list = clubsByMediaId.get(r.media_id) ?? [];
    list.push(ref);
    clubsByMediaId.set(r.media_id, list);
  }

  return { artistsByMediaId, albumsByMediaId, clubsByMediaId };
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
  client: SupabaseClient,
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
    const client = await getServerClient();
    const { data, error } = await client
      .from('music_media')
      .select(BASE_SELECT)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return hydrateRows(client, data as BaseRow[]);
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
