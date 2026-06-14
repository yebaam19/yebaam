import type { AdminClubEditRow } from './AdminClubEditModal';

/** A music-club row as rendered in the admin clubs table — the editable base
 *  fields plus the read-only genre + counter columns. */
export interface ClubRow extends AdminClubEditRow {
  music_genre_id: string;
  genre_slug: string;
  genre_name: string;
  member_count: number;
  pending_count: number;
  post_count: number;
  article_count: number;
  forum_enabled: boolean;
}

export interface GenreOption {
  id: string;
  name: string;
}
