import 'server-only';
import { cache } from 'react';
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
export { listAlbumsFiltered } from './music-albums-filtered.server';
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

export interface AlbumsPage {
  albums: MusicAlbumRow[];
  total: number;
  /** Requested page clamped to [1, pageCount]. */
  page: number;
  pageCount: number;
}

export const listAlbumsPage = cache(
  async (requestedPage: number, pageSize = 24): Promise<AlbumsPage> => {
    const client = await getServerClient();
    const { count } = await client
      .from('music_albums')
      .select('id', { count: 'exact', head: true });
    const total = count ?? 0;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1;
    const page = Math.min(Math.max(1, safePage), pageCount);
    const from = (page - 1) * pageSize;
    const { data } = await client
      .from('music_albums')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + pageSize - 1);
    return { albums: (data as MusicAlbumRow[] | null) ?? [], total, page, pageCount };
  },
);

/** Resolve artist display names for a set of album rows in one query.
 *  Intentionally not wrapped in react.cache(): callers pass a fresh array each
 *  render, so reference-keyed memoization would never hit. */
export async function getArtistNamesByIds(artistIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const ids = Array.from(new Set(artistIds));
  if (ids.length === 0) return map;
  const client = await getServerClient();
  const { data } = await client.from('music_artists').select('id, name').in('id', ids);
  for (const a of ((data ?? []) as Array<{ id: string; name: string }>)) {
    map.set(a.id, a.name);
  }
  return map;
}

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
  client: Awaited<ReturnType<typeof getServerClient>>;
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
