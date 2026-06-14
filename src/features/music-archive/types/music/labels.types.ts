import type { MusicAlbumRow } from './albums.types';

export interface MusicLabelRow {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  founded: number | null;
  created_at: string;
}

export interface LabelWithDiscography extends MusicLabelRow {
  albums: MusicAlbumRow[];
}

export interface CreateLabelDto {
  name: string;
  country?: string;
  founded?: number;
}

/** Editable fields on an existing label (admin CRUD). */
export interface UpdateLabelDto {
  name?: string;
  country?: string | null;
  founded?: number | null;
}
