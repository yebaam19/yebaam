/**
 * Upload size limits shared by browser pre-validation and server enforcement.
 * Client-safe (no server-only imports) — imported by upload.service.ts on the
 * client and by the music-archive Server Actions on the server, so the two
 * sides can never drift.
 */

/** Max audio file size accepted for music tracks (enforced server-side via R2 HEAD). */
export const MAX_AUDIO_BYTES = 200 * 1024 * 1024;

/** Cloudflare Images hard cap per uploaded file (the API rejects bigger files). */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Cloudflare Stream direct-creator-upload cap per file (basic uploads). */
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}
