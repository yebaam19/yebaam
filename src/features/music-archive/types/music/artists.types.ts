import type { MusicAlbumRow } from './albums.types';

export interface MusicArtistRow {
  id: string;
  name: string;
  slug: string;
  alias: string[] | null;
  country: string | null;
  born_year: number | null;
  died_year: number | null;
  bio_short: string | null;
  photo_cf_image_id: string | null;
  contributed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArtistWithDiscography extends MusicArtistRow {
  albums: MusicAlbumRow[];
}

export interface CreateArtistDto {
  name: string;
  country?: string;
  bornYear?: number;
  diedYear?: number;
  bioShort?: string;
  photoCfImageId?: string;
}

/** Editable fields on an existing artist (admin CRUD). */
export interface UpdateArtistDto {
  name?: string;
  country?: string | null;
  bornYear?: number | null;
  diedYear?: number | null;
  bioShort?: string | null;
  photoCfImageId?: string | null;
}
