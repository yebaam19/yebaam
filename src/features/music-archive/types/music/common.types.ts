export type MusicAlbumFormat = 'lp' | '78rpm' | 'single' | 'ep' | 'compilation' | 'cd' | 'cassette';
/** Physical grading of the contributor's copy. Goldmine scale, mapped to the
 *  `album_condition` Postgres enum. Null when the contributor didn't grade it. */
export type AlbumCondition = 'mint' | 'near_mint' | 'very_good' | 'good' | 'fair' | 'poor';

export const ALBUM_CONDITION_LABELS: Record<AlbumCondition, string> = {
  mint: 'Mint (M)',
  near_mint: 'Near Mint (NM)',
  very_good: 'Very Good (VG)',
  good: 'Good (G)',
  fair: 'Fair (F)',
  poor: 'Poor (P)',
};
export type MusicTrackFormat = 'mp3' | 'flac' | 'wav' | 'ogg';
export type MusicTrackSide = 'a' | 'b';
export type MusicSourceMedia = '78rpm' | 'lp' | 'single' | 'cassette' | 'reel' | 'cd' | 'digital';
export type MusicCopyrightStatus = 'public_domain' | 'licensed' | 'orphan' | 'fair_use_archival' | 'claimed';
export type MusicCreditRole =
  | 'composer'
  | 'lyricist'
  | 'performer'
  | 'arranger'
  | 'conductor'
  | 'producer'
  | 'vocals';

export type MusicImportSource = 'archive_org' | 'loc_gov' | 'smithsonian' | 'generic';

// ---------- Phase A: music club deep features ----------

/** Lightweight reference to a row in `music_genres`. The full row lives in
 *  `server/genres.server.ts`. Used wherever we surface a genre's slug + name
 *  alongside a club. */
export interface MusicGenreRef {
  id: string;
  slug: string;
  name: string;
}

export type AlbumReactionKind = 'like' | 'love' | 'fire' | 'star';

export type ClubLinkKind = 'venue' | 'museum' | 'shop' | 'archive' | 'related';

export type ClubMemberRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
