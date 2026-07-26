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

/** Max PDF document size (CVs de servicios profesionales → R2 presigned PUT).
 *  Enforced client-side (uploadDocument), at pre-sign (/api/upload/file-url)
 *  and bound into the presigned URL's ContentLength. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/** Chat attachment caps (voice notes / audio files and documents, both R2).
 *  Live here rather than in the chat feature because the presign routes must
 *  enforce the same number the browser pre-checks — a client-only cap is not a
 *  cap at all when the sign endpoint is reachable with a hand-made body. */
export const MAX_CHAT_AUDIO_BYTES = 25 * 1024 * 1024;
export const MAX_CHAT_FILE_BYTES = 25 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}
