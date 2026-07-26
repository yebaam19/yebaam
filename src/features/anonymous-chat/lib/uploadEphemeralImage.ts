import { uploadService } from '@/lib/service/upload.service';
import type { AnonMediaPayload } from '../types';

/** Ephemeral media lives 5 minutes, per the spec. */
export const EPHEMERAL_MEDIA_TTL_MS = 5 * 60 * 1000;

/**
 * Upload an image for an anonymous chat: PRIVATE (requireSignedURLs) so it can
 * only ever be viewed through a short-lived signed URL, and stamped with a
 * 5-minute expiry. Shared by the attach button and the in-app camera so the
 * privacy/TTL rules can't drift between them.
 *
 * `source` is what lets `/api/anon-chat/media-url` and `/api/anon-chat/media-delete`
 * authorize at all: this media has no database row, so the server-stamped
 * Cloudflare metadata is the only record that an id belongs to this surface and
 * to this uploader. Drop it and those routes fall back to serving any image in
 * the account.
 */
export async function uploadEphemeralImage(file: File): Promise<AnonMediaPayload> {
  const { id } = await uploadService.uploadImage(file, undefined, {
    requireSignedURLs: true,
    source: 'anon-chat',
  });
  return { kind: 'image', cfId: id, expiresAt: Date.now() + EPHEMERAL_MEDIA_TTL_MS };
}
