// Barrel for the music-archive types. The declarations were split into cohesive
// per-entity sub-modules under `./music/` for reviewability; this file re-exports
// every symbol so existing import specifiers keep resolving unchanged.

// Shared scalar/union types + the album-condition label map (runtime value).
export { ALBUM_CONDITION_LABELS } from './music/common.types';
export type {
  MusicAlbumFormat,
  AlbumCondition,
  MusicTrackFormat,
  MusicTrackSide,
  MusicSourceMedia,
  MusicCopyrightStatus,
  MusicCreditRole,
  MusicImportSource,
  MusicGenreRef,
  AlbumReactionKind,
  ClubLinkKind,
  ClubMemberRole,
} from './music/common.types';

// Artists.
export type {
  MusicArtistRow,
  ArtistWithDiscography,
  CreateArtistDto,
  UpdateArtistDto,
} from './music/artists.types';

// Labels.
export type {
  MusicLabelRow,
  LabelWithDiscography,
  CreateLabelDto,
  UpdateLabelDto,
} from './music/labels.types';

// Albums.
export type {
  MusicAlbumRow,
  AdminAlbumListItem,
  AlbumWithDetails,
  CreateAlbumDto,
  UpdateAlbumDto,
} from './music/albums.types';

// Tracks.
export type {
  MusicTrackRow,
  MusicTrackCreditRow,
  CreateTrackDto,
  AddTrackCreditDto,
  CreateTrackBatchItem,
  UpdateTrackDto,
} from './music/tracks.types';

// Import preview shapes.
export type {
  DetectedTrackPreview,
  DetectedAlbumPreview,
  ExtractedImportPreview,
} from './music/import.types';

// Search.
export type { MusicSearchHit } from './music/search.types';

// Player.
export type { PlayItem } from './music/player.types';

// Articles.
export type {
  MusicArticleRow,
  MusicArticleAuthor,
  MusicArticleArtistRef,
  MusicArticleWithRefs,
} from './music/articles.types';

// Clubs.
export type {
  ClubLinkRow,
  AlbumReactionCounts,
  ClubMemberRow,
  ClubPostRow,
} from './music/clubs.types';
