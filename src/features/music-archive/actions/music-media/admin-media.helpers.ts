import type { MusicMediaItem } from '../../types/music-media.types';

export type RawAdminMediaRow = {
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

/** Collapse a list of reference rows into an id -> row lookup. */
export function buildRefMap<T extends { id: string }>(rows: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const a of rows) map.set(a.id, a);
  return map;
}

/** Group reference objects by their pivot's media_id. `key` names the pivot
 *  column that points at the referenced row (e.g. 'artist_id'). */
export function groupRefsByMediaId<P extends { media_id: string }, R>(
  pivotRows: P[],
  refMap: Map<string, R>,
  key: keyof P,
): Map<string, R[]> {
  const byMediaId = new Map<string, R[]>();
  for (const r of pivotRows) {
    const ref = refMap.get(r[key] as unknown as string);
    if (!ref) continue;
    const list = byMediaId.get(r.media_id) ?? [];
    list.push(ref);
    byMediaId.set(r.media_id, list);
  }
  return byMediaId;
}

/** Stitch the base media rows together with their artist / album / club refs
 *  into the public MusicMediaItem[] shape returned by listAdminMusicMedia. */
export function assembleAdminMediaItems(
  rows: RawAdminMediaRow[],
  pivots: {
    aRows: Array<{ media_id: string; artist_id: string }>;
    bRows: Array<{ media_id: string; album_id: string }>;
    cRows: Array<{ media_id: string; club_id: string }>;
    aRes: Array<{ id: string; name: string; slug: string }>;
    bRes: Array<{ id: string; title: string; slug: string }>;
    cRes: Array<{ id: string; name: string; slug: string }>;
  },
): MusicMediaItem[] {
  const aMap = buildRefMap(pivots.aRes);
  const bMap = buildRefMap(pivots.bRes);
  const cMap = buildRefMap(pivots.cRes);

  const artistsByMediaId = groupRefsByMediaId(pivots.aRows, aMap, 'artist_id');
  const albumsByMediaId = groupRefsByMediaId(pivots.bRows, bMap, 'album_id');
  const clubsByMediaId = groupRefsByMediaId(pivots.cRows, cMap, 'club_id');

  return rows.map((r) => ({
    ...r,
    artists: artistsByMediaId.get(r.id) ?? [],
    albums: albumsByMediaId.get(r.id) ?? [],
    clubs: clubsByMediaId.get(r.id) ?? [],
  }));
}
