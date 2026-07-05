import { imageUrl, streamThumb } from '@/lib/media/urls';

/**
 * Render-time URL builders for `profile_photos` / `profile_videos` rows.
 *
 * id-first: `storage_key` holds the Cloudflare id and `storage_bucket` tells
 * which product it lives in. New rows persist an empty `url` (the column is
 * NOT NULL in the frozen schema), so URLs are rebuilt here; legacy rows that
 * stored a full delivery URL fall back to it unchanged.
 */

export const CLOUDFLARE_IMAGES_BUCKET = 'cloudflare-images';
export const CLOUDFLARE_STREAM_BUCKET = 'cloudflare-stream';

type PhotoUrlRow = {
  storage_bucket: string | null;
  storage_key: string | null;
  url: string | null;
};

type VideoUrlRow = PhotoUrlRow & {
  thumbnail_url?: string | null;
};

export function isCloudflareMediaBucket(bucket: string | null | undefined): boolean {
  return bucket === CLOUDFLARE_IMAGES_BUCKET || bucket === CLOUDFLARE_STREAM_BUCKET;
}

/** Delivery URL for a profile photo row: Cloudflare Images id first, legacy `url` fallback. */
export function profilePhotoUrl(row: PhotoUrlRow): string {
  if (row.storage_bucket === CLOUDFLARE_IMAGES_BUCKET && row.storage_key) {
    try {
      return imageUrl(row.storage_key, 'public');
    } catch {
      // NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH missing — fall through to legacy url.
    }
  }
  return row.url ?? '';
}

/**
 * Playback + poster URLs for a profile video row. Cloudflare Stream rows use
 * the iframe player URL (what `UserMedia` detects to embed an `<iframe>`) and
 * derive the poster via `streamThumb`; legacy rows pass their columns through.
 */
export function profileVideoUrls(row: VideoUrlRow): { url: string; thumbnailUrl?: string } {
  if (row.storage_bucket === CLOUDFLARE_STREAM_BUCKET && row.storage_key) {
    return {
      url: `https://iframe.videodelivery.net/${row.storage_key}`,
      thumbnailUrl: row.thumbnail_url ?? streamThumb(row.storage_key),
    };
  }
  return {
    url: row.url ?? '',
    thumbnailUrl: row.thumbnail_url ?? undefined,
  };
}
