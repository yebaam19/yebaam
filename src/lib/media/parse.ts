import type { MediaItem, MediaKind } from './types';

/**
 * Parsers from every storage shape in the app to the canonical `MediaItem`.
 *
 * One file owns the JSONB key aliases so the rest of the app can speak in a
 * single type. Bad rows (no usable Cloudflare id) are dropped silently — this
 * matches the defensive behavior of the existing per-call-site parsers.
 *
 * Wire shapes are NOT changed by this module. It only reads.
 */

type RawObject = Record<string, unknown>;

function asRecord(value: unknown): RawObject | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as RawObject)
    : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeKind(value: unknown): MediaKind | undefined {
  const raw = typeof value === 'string' ? value.toLowerCase() : '';
  if (raw === 'video') return 'video';
  if (raw === 'image' || raw === 'photo') return 'image';
  return undefined;
}

// ---------------------------------------------------------------------------
// posts.media_files[] — camelCase. Source of truth for shape: src/app/api/posts/route.ts
// ---------------------------------------------------------------------------

/** Parse the `posts.media_files` JSONB column into MediaItems. */
export function fromPostMedia(raw: unknown): MediaItem[] {
  if (!Array.isArray(raw)) return [];
  const out: MediaItem[] = [];
  for (const entry of raw) {
    const item = asRecord(entry);
    if (!item) continue;

    const kind = normalizeKind(item.type ?? item.kind);
    if (!kind) continue;

    // Videos: streamUid (camel) is canonical, snake-case + cloudflare_stream_uid
    // are tolerated for legacy rows (matches normalizeMedia in lib/api/posts.ts).
    // Images: s3Key was the legacy presigned-S3 key; for Cloudflare Images we
    // keep reading whatever id the writer stored.
    const cfId =
      kind === 'video'
        ? asString(item.streamUid) ??
          asString(item.stream_uid) ??
          asString(item.cloudflare_stream_uid) ??
          asString(item.cfVideoUid) ??
          asString(item.cf_video_uid)
        : asString(item.cfImageId) ??
          asString(item.cf_image_id) ??
          asString(item.imageId) ??
          asString(item.s3Key) ??
          asString(item.s3_key);
    if (!cfId) continue;

    out.push({
      kind,
      cfId,
      thumbnailUrl: asString(item.thumbnailUrl) ?? asString(item.thumbnail_url) ?? asString(item.thumbnail),
      durationSeconds: asNumber(item.duration) ?? asNumber(item.durationSeconds),
      mimeType: asString(item.mimeType) ?? asString(item.mime_type),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// community_posts.media[] — snake_case. Source: src/lib/api/communities.ts
// ---------------------------------------------------------------------------

/** Parse the `community_posts.media` JSONB column into MediaItems. */
export function fromCommunityMedia(raw: unknown): MediaItem[] {
  if (!Array.isArray(raw)) return [];
  const out: MediaItem[] = [];
  for (const entry of raw) {
    const item = asRecord(entry);
    if (!item) continue;

    const kind = normalizeKind(item.kind ?? item.type);
    if (!kind) continue;

    const cfId =
      kind === 'video'
        ? asString(item.cf_video_uid) ?? asString(item.cfVideoUid)
        : asString(item.cf_image_id) ?? asString(item.cfImageId);
    if (!cfId) continue;

    out.push({
      kind,
      cfId,
      thumbnailUrl: asString(item.thumbnail) ?? asString(item.thumbnail_url) ?? asString(item.thumbnailUrl),
      durationSeconds: asNumber(item.duration) ?? asNumber(item.duration_seconds),
      mimeType: asString(item.mime_type) ?? asString(item.mimeType),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// profile_videos / profile_photos — flat rows (snake_case columns). Source:
// src/features/profile/services/profile-media.service.ts (DbVideo / DbPhoto).
// ---------------------------------------------------------------------------

export type ProfileVideoRow = {
  storage_key: string | null;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  mime_type?: string | null;
};

export type ProfilePhotoRow = {
  storage_key: string | null;
  mime_type?: string | null;
};

/** Parse a single `profile_videos` row into a MediaItem, or null if unusable. */
export function fromProfileVideoRow(row: ProfileVideoRow): MediaItem | null {
  const cfId = asString(row.storage_key);
  if (!cfId) return null;
  return {
    kind: 'video',
    cfId,
    thumbnailUrl: asString(row.thumbnail_url),
    durationSeconds: asNumber(row.duration_seconds),
    mimeType: asString(row.mime_type),
  };
}

/** Parse a single `profile_photos` row into a MediaItem, or null if unusable. */
export function fromProfilePhotoRow(row: ProfilePhotoRow): MediaItem | null {
  const cfId = asString(row.storage_key);
  if (!cfId) return null;
  return {
    kind: 'image',
    cfId,
    mimeType: asString(row.mime_type),
  };
}
