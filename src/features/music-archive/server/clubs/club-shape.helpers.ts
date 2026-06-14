import type { MusicClubRow } from '../clubs.server';

export type ClubGenreJoin =
  | { slug: string; name: string }
  | Array<{ slug: string; name: string }>
  | null;

export const CLUB_SELECT =
  'id, name, slug, description, music_genre_id, cover_image_url, profile_image_url, music_genres!inner(slug, name)';

export function pickGenre(j: ClubGenreJoin): { slug: string; name: string } {
  if (!j) return { slug: '', name: '' };
  return Array.isArray(j) ? (j[0] ?? { slug: '', name: '' }) : j;
}

export type ClubRowRaw = {
  id: string;
  name: string;
  slug: string;
  description: string;
  music_genre_id: string;
  cover_image_url: string | null;
  profile_image_url: string | null;
  music_genres: ClubGenreJoin;
};

/** Project a raw clubs+genre join row into the public MusicClubRow shape, given
 *  already-resolved album + member counts. */
export function mapClubRow(
  raw: ClubRowRaw,
  counts: { albumCount: number; memberCount: number },
): MusicClubRow {
  const g = pickGenre(raw.music_genres);
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    music_genre_id: raw.music_genre_id,
    genre_slug: g.slug,
    genre_name: g.name,
    cover_image_url: raw.cover_image_url,
    profile_image_url: raw.profile_image_url,
    album_count: counts.albumCount,
    member_count: counts.memberCount,
  };
}
