import type { AlbumCondition, MusicAlbumFormat } from './common.types';
import type { MusicArtistRow } from './artists.types';
import type { MusicLabelRow } from './labels.types';
import type { MusicTrackCreditRow, MusicTrackRow } from './tracks.types';

export interface MusicAlbumRow {
  id: string;
  artist_id: string;
  label_id: string | null;
  title: string;
  slug: string;
  year: number | null;
  decade: number | null;
  country: string | null;
  accompaniment: string | null;
  format: MusicAlbumFormat;
  cover_cf_image_id: string | null;
  back_cover_cf_image_id: string | null;
  label_cf_image_id: string | null;
  catalog_number: string | null;
  notes: string | null;
  condition: AlbumCondition | null;
  for_trade: boolean;
  contributed_by: string | null;
  created_at: string;
}

/**
 * Flattened album row for the admin albums list (`listAdminAlbums` →
 * `AdminAlbumsList`). `format`/`condition` stay loosely typed as strings
 * because they come straight off the admin DB select; the editor narrows
 * them when needed. Single source of truth shared by the action's return
 * type, `AdminMusicTabs`, and `AdminAlbumsList`.
 */
export interface AdminAlbumListItem {
  id: string;
  title: string;
  slug: string;
  year: number | null;
  country: string | null;
  format: string;
  cover_cf_image_id: string | null;
  catalog_number: string | null;
  condition: string | null;
  for_trade: boolean;
  artist_id: string;
  artist_name: string;
  track_count: number;
}

export interface AlbumWithDetails extends MusicAlbumRow {
  artist: Pick<MusicArtistRow, 'id' | 'name' | 'slug' | 'photo_cf_image_id'>;
  label: Pick<MusicLabelRow, 'id' | 'name' | 'slug'> | null;
  tracks: (MusicTrackRow & { credits: MusicTrackCreditRow[] })[];
}

export interface CreateAlbumDto {
  artistId: string;
  labelId?: string;
  title: string;
  year?: number;
  decade?: number;
  country?: string;
  accompaniment?: string;
  format: MusicAlbumFormat;
  coverCfImageId?: string;
  backCoverCfImageId?: string;
  labelCfImageId?: string;
  catalogNumber?: string;
  notes?: string;
  condition?: AlbumCondition;
  forTrade?: boolean;
}

/** Editable fields on an existing album (admin CRUD). */
export interface UpdateAlbumDto {
  title?: string;
  year?: number | null;
  decade?: number | null;
  country?: string | null;
  accompaniment?: string | null;
  format?: MusicAlbumFormat;
  artistId?: string;
  labelId?: string | null;
  coverCfImageId?: string | null;
  backCoverCfImageId?: string | null;
  labelCfImageId?: string | null;
  catalogNumber?: string | null;
  notes?: string | null;
  condition?: AlbumCondition | null;
  forTrade?: boolean;
}
