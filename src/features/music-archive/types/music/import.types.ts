import type { MusicAlbumFormat, MusicImportSource, MusicTrackFormat } from './common.types';

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

export interface ExtractedImportPreview {
  importId: string;
  source: MusicImportSource;
  source_url: string;
  detected: DetectedAlbumPreview;
}
