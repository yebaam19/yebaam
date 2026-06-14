/** The editable base fields of a music club, shared by `AdminClubEditModal`
 *  and its `useAdminClubEdit` hook. Re-exported from the modal as
 *  `AdminClubEditRow` (the shape the admin clubs table extends). */
export interface ClubRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  rules: string[];
  cover_image_url: string | null;
  music_genre_id?: string;
  genre_name?: string;
}

export interface GenreOption {
  id: string;
  name: string;
}
