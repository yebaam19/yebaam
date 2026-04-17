/**
 * Client-safe URL builders for Cloudflare-hosted media.
 *
 * We store only the Cloudflare ID / UID in the database. Full URLs are built
 * at render time so variant changes or account migrations don't require a
 * data rewrite.
 *
 * During the Supabase → Cloudflare transition, the `resolveImage` / `resolveVideo`
 * helpers fall back to the legacy URL column if no Cloudflare ID is present.
 */

const ACCOUNT_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? '';

/**
 * Cloudflare Stream "Customer Code" can be pasted as:
 *   - just the code:            `hih5q86kaysqej1k`
 *   - the full subdomain:       `customer-hih5q86kaysqej1k.cloudflarestream.com`
 *   - or a URL:                 `https://customer-hih5q86kaysqej1k.cloudflarestream.com`
 * Normalise to just the code (`hih5q86kaysqej1k`) so we can template it uniformly.
 */
const STREAM_CUSTOMER_CODE = (() => {
  const raw = (process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE ?? '').trim();
  if (!raw) return '';
  const match = raw.match(/customer-([^.\s/]+)/);
  return match ? match[1] : raw;
})();

export type ImageVariant = 'public' | 'avatar' | 'cover' | 'thumbnail' | 'hero';

export function imageUrl(id: string, variant: ImageVariant = 'public'): string {
  if (!ACCOUNT_HASH) {
    throw new Error('NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH is not set');
  }
  return `https://imagedelivery.net/${ACCOUNT_HASH}/${id}/${variant}`;
}

export function streamThumb(uid: string, opts?: { time?: number; width?: number; height?: number }): string {
  const params = new URLSearchParams();
  if (opts?.time) params.set('time', `${opts.time}s`);
  if (opts?.width) params.set('width', String(opts.width));
  if (opts?.height) params.set('height', String(opts.height));
  const qs = params.toString();
  return `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg${qs ? `?${qs}` : ''}`;
}

export function streamHlsUrl(uid: string): string {
  if (!STREAM_CUSTOMER_CODE) {
    throw new Error('NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE is not set');
  }
  return `https://customer-${STREAM_CUSTOMER_CODE}.cloudflarestream.com/${uid}/manifest/video.m3u8`;
}

/**
 * Prefer the Cloudflare Images id; fall back to the legacy URL during transition.
 * Callers can pass whatever row shape they have; any truthy `cloudflare_image_id`
 * (or camelCase equivalent) wins.
 */
export function resolveImage(
  row:
    | {
        cloudflare_image_id?: string | null;
        cloudflareImageId?: string | null;
        avatar_image_id?: string | null;
        cover_image_id?: string | null;
        url?: string | null;
        avatar_url?: string | null;
        cover_photo_url?: string | null;
        media_url?: string | null;
      }
    | null
    | undefined,
  variant: ImageVariant = 'public',
): string | null {
  if (!row) return null;
  const id =
    row.cloudflare_image_id ??
    row.cloudflareImageId ??
    row.avatar_image_id ??
    row.cover_image_id ??
    null;
  if (id) return imageUrl(id, variant);
  return row.url ?? row.avatar_url ?? row.cover_photo_url ?? row.media_url ?? null;
}

export function resolveVideoUid(
  row:
    | {
        cloudflare_stream_uid?: string | null;
        cloudflareStreamUid?: string | null;
      }
    | null
    | undefined,
): string | null {
  if (!row) return null;
  return row.cloudflare_stream_uid ?? row.cloudflareStreamUid ?? null;
}
