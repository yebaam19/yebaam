export type MediaKind = 'image' | 'video';

/**
 * Canonical media item — derived from any of the JSONB or row-level media
 * sources in the app (post media_files, community_posts media, profile_videos,
 * profile_photos). Use the parsers in `./parse.ts` to produce one.
 *
 * Field scope is intentionally media-only: row-level concerns (post caption,
 * post aspect_ratio, author, etc.) live on the calling row and get merged in
 * by the consumer, not by the parsers.
 */
export interface MediaItem {
  readonly kind: MediaKind;
  /** Cloudflare Stream uid (videos) or Cloudflare Images id (images). */
  readonly cfId: string;
  readonly thumbnailUrl?: string;
  readonly durationSeconds?: number;
  readonly mimeType?: string;
}
