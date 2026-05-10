export type MusicAlbumFormat = 'lp' | '78rpm' | 'single' | 'ep' | 'compilation' | 'cd' | 'cassette';
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

export interface MusicLabelRow {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  founded: number | null;
  created_at: string;
}

export interface MusicAlbumRow {
  id: string;
  artist_id: string;
  label_id: string | null;
  title: string;
  slug: string;
  year: number | null;
  country: string | null;
  format: MusicAlbumFormat;
  cover_cf_image_id: string | null;
  back_cover_cf_image_id: string | null;
  label_cf_image_id: string | null;
  catalog_number: string | null;
  notes: string | null;
  contributed_by: string | null;
  created_at: string;
}

export interface MusicTrackRow {
  id: string;
  album_id: string;
  position: number;
  side: MusicTrackSide | null;
  title: string;
  duration_seconds: number | null;
  r2_key: string;
  format: MusicTrackFormat;
  bitrate_kbps: number | null;
  source_media: MusicSourceMedia | null;
  copyright_status: MusicCopyrightStatus;
  contributor_attestation: boolean;
  contributed_by: string | null;
  restored_by_note: string | null;
  play_count: number;
  created_at: string;
}

export interface MusicTrackCreditRow {
  id: string;
  track_id: string;
  role: MusicCreditRole;
  credit_name: string;
  artist_id: string | null;
}

export interface AlbumWithDetails extends MusicAlbumRow {
  artist: Pick<MusicArtistRow, 'id' | 'name' | 'slug' | 'photo_cf_image_id'>;
  label: Pick<MusicLabelRow, 'id' | 'name' | 'slug'> | null;
  tracks: (MusicTrackRow & { credits: MusicTrackCreditRow[] })[];
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

export interface CreateLabelDto {
  name: string;
  country?: string;
  founded?: number;
}

export interface CreateAlbumDto {
  artistId: string;
  labelId?: string;
  title: string;
  year?: number;
  country?: string;
  format: MusicAlbumFormat;
  coverCfImageId?: string;
  backCoverCfImageId?: string;
  labelCfImageId?: string;
  catalogNumber?: string;
  notes?: string;
}

export interface CreateTrackDto {
  albumId: string;
  position: number;
  side?: MusicTrackSide;
  title: string;
  durationSeconds?: number;
  r2Key: string;
  format: MusicTrackFormat;
  bitrateKbps?: number;
  sourceMedia?: MusicSourceMedia;
  copyrightStatus: MusicCopyrightStatus;
  contributorAttestation: boolean;
  restoredByNote?: string;
}

export interface AddTrackCreditDto {
  trackId: string;
  role: MusicCreditRole;
  creditName: string;
  artistId?: string;
}

/** One row passed to `createTracksBatchAction`. The album_id and contributor
 *  attestation come from the action's other parameter and the auth gate. */
export interface CreateTrackBatchItem {
  position: number;
  side?: MusicTrackSide | null;
  title: string;
  durationSeconds?: number | null;
  r2Key: string;
  format: MusicTrackFormat;
  sourceMedia?: MusicSourceMedia | null;
  copyrightStatus: MusicCopyrightStatus;
  restoredByNote?: string | null;
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

/** Editable fields on an existing album (admin CRUD). */
export interface UpdateAlbumDto {
  title?: string;
  year?: number | null;
  country?: string | null;
  format?: MusicAlbumFormat;
  artistId?: string;
  labelId?: string | null;
  coverCfImageId?: string | null;
  backCoverCfImageId?: string | null;
  labelCfImageId?: string | null;
  catalogNumber?: string | null;
  notes?: string | null;
}

/** Editable fields on an existing track (admin CRUD). */
export interface UpdateTrackDto {
  title?: string;
  position?: number;
  side?: MusicTrackSide | null;
  durationSeconds?: number | null;
  sourceMedia?: MusicSourceMedia | null;
  copyrightStatus?: MusicCopyrightStatus;
  restoredByNote?: string | null;
}

/** Editable fields on an existing label (admin CRUD). */
export interface UpdateLabelDto {
  name?: string;
  country?: string | null;
  founded?: number | null;
}

/** Detected import preview returned by the Firecrawl-backed extractor.
 *  Shape mirrors `DetectedAlbum` from server/music.importer but is duplicated
 *  here so client components (the admin importer UI) can type-import it
 *  without bundling the server-only importer module. */
export interface DetectedTrackPreview {
  position: number;
  title: string;
  duration_seconds?: number | null;
  audio_url: string;
  format?: MusicTrackFormat;
}

export interface DetectedAlbumPreview {
  artist_name: string;
  album_title: string;
  year: number | null;
  country: string | null;
  format: MusicAlbumFormat | null;
  label: string | null;
  catalog_number: string | null;
  cover_image_url: string | null;
  notes: string | null;
  tracks: DetectedTrackPreview[];
}

export type MusicImportSource = 'archive_org' | 'loc_gov' | 'smithsonian' | 'generic';

export interface ExtractedImportPreview {
  importId: string;
  source: MusicImportSource;
  source_url: string;
  detected: DetectedAlbumPreview;
}

/** Combined-search hit shape consumed by the autocomplete dropdown.
 *  Lives here (not in `server/music.server.ts`) so client components can
 *  type-import it without crossing the server-only boundary. */
export interface MusicSearchHit {
  type: 'artist' | 'album' | 'track';
  id: string;
  label: string;
  sublabel: string | null;
  href: string;
}

/** Lightweight row used by the player queue. */
export interface PlayItem {
  trackId: string;
  title: string;
  artistName: string;
  albumSlug: string;
  artistSlug: string;
  coverCfId: string | null;
  audioUrl: string;
  durationSeconds: number;
}

// ---------- Phase A: music club deep features ----------

export type AlbumReactionKind = 'like' | 'love' | 'fire' | 'star';

export type ClubLinkKind = 'venue' | 'museum' | 'shop' | 'archive' | 'related';

export type ClubMemberRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';

export interface MusicArticleRow {
  id: string;
  club_id: string | null;
  author_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  content: string;
  summary: string | null;
  cf_image_id: string | null;
  tags: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MusicArticleAuthor {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_cf_image_id: string | null;
}

export interface MusicArticleArtistRef {
  id: string;
  name: string;
  slug: string;
}

export interface MusicArticleWithRefs extends MusicArticleRow {
  author: MusicArticleAuthor | null;
  artists: MusicArticleArtistRef[];
  club: { id: string; slug: string; name: string } | null;
}

export interface ClubLinkRow {
  id: string;
  club_id: string;
  label: string;
  url: string;
  kind: ClubLinkKind;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AlbumReactionCounts {
  like: number;
  love: number;
  fire: number;
  star: number;
  userReaction: AlbumReactionKind | null;
}

export interface ClubMemberRow {
  user_id: string;
  club_id: string;
  role: ClubMemberRole;
  joined_at: string;
  username: string | null;
  full_name: string | null;
  avatar_cf_image_id: string | null;
}

export interface ClubPostRow {
  id: string;
  club_id: string;
  author_id: string;
  kind: string;
  title: string | null;
  body: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  album_id: string | null;
  views: number;
  reactions_count: number;
  comments_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  author: MusicArticleAuthor | null;
}
