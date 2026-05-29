import { uploadService } from '@/lib/service/upload.service';
import type { AnonMediaPayload } from '../types';

/** Ephemeral media lives 5 minutes, per the spec. */
export const EPHEMERAL_MEDIA_TTL_MS = 5 * 60 * 1000;

/**
 * Upload an image for an anonymous chat: PRIVATE (requireSignedURLs) so it can
 * only ever be viewed through a short-lived signed URL, and stamped with a
 * 5-minute expiry. Shared by the attach button and the in-app camera so the
 * privacy/TTL rules can't drift between them.
 */
export async function uploadEphemeralImage(file: File): Promise<AnonMediaPayload> {
  const { id } = await uploadService.uploadImage(file, undefined, { requireSignedURLs: true });
  return { kind: 'image', cfId: id, expiresAt: Date.now() + EPHEMERAL_MEDIA_TTL_MS };
}
