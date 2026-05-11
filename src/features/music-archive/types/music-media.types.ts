export type MusicMediaKind = 'photo' | 'video';
export type MusicMediaSource = 'cf_image' | 'cf_stream' | 'embed';
export type MusicMediaEmbedProvider = 'youtube' | 'vimeo';

export interface MusicMediaArtistRef {
  id: string;
  name: string;
  slug: string;
}

export interface MusicMediaAlbumRef {
  id: string;
  title: string;
  slug: string;
}

export interface MusicMediaClubRef {
  id: string;
  name: string;
  slug: string;
}

export interface MusicMediaItem {
  id: string;
  kind: MusicMediaKind;
  source: MusicMediaSource;
  cf_image_id: string | null;
  cf_stream_uid: string | null;
  embed_url: string | null;
  embed_provider: MusicMediaEmbedProvider | null;
  thumbnail_cf_image_id: string | null;
  caption: string | null;
  duration_seconds: number | null;
  uploaded_by: string | null;
  created_at: string;
  artists: MusicMediaArtistRef[];
  albums: MusicMediaAlbumRef[];
  clubs: MusicMediaClubRef[];
}

export interface CreateMusicMediaInput {
  kind: MusicMediaKind;
  source: MusicMediaSource;
  cfImageId?: string;
  cfStreamUid?: string;
  embedUrl?: string;
  thumbnailCfImageId?: string;
  caption?: string;
  durationSeconds?: number;
  artistIds?: string[];
  albumIds?: string[];
  clubIds?: string[];
}

export interface UpdateMusicMediaInput {
  caption?: string | null;
  artistIds?: string[];
  albumIds?: string[];
  clubIds?: string[];
}
