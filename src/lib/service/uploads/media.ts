import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, formatBytes } from '@/lib/upload-limits';
import type { CloudflareImageUploadResult, CloudflareStreamUploadResult, MultipartUpload } from './types';

export function createMediaUploads(uploadToCloudflare: MultipartUpload) {
  /**
   * Upload an image using Cloudflare Images Direct Creator Upload.
   * Returns the CF image id plus the full delivery URL (public variant).
   * For sensitive content (ID documents), enforce privacy at the DB layer
   * (RLS) — never expose the cf id to non-authorized users.
   */
  async function uploadImage(
    file: File,
    onProgress?: (progress: number) => void,
    options?: {
      metadata?: Record<string, string>;
      /** Required for KYC photos / ID documents. When true, the returned `url` is null
       *  (the image cannot be fetched without a server-minted signed URL). */
      requireSignedURLs?: boolean;
      /** Surface this image belongs to, stamped server-side into Cloudflare's
       *  metadata. Routes that act on an image with no DB row of its own (the
       *  ephemeral anon-chat media endpoints) authorize against it. */
      source?: string;
    },
  ): Promise<CloudflareImageUploadResult> {
    if (!file.type.startsWith('image/')) {
      throw new Error('uploadImage called with a non-image file');
    }
    // Cloudflare Images rejects files over 10 MB — fail here, before uploading.
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(
        `La imagen "${file.name}" pesa ${formatBytes(file.size)} y supera el máximo de ${formatBytes(MAX_IMAGE_BYTES)}. Redúcela e inténtalo de nuevo.`,
      );
    }

    const signRes = await fetch('/api/upload/image-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metadata: { filename: file.name, ...(options?.metadata ?? {}) },
        requireSignedURLs: options?.requireSignedURLs === true,
        ...(options?.source ? { source: options.source } : {}),
      }),
    });
    const signPayload = await signRes.json().catch(() => null);
    if (!signRes.ok || !signPayload?.data?.uploadURL) {
      throw new Error(signPayload?.error || 'No se pudo generar la URL de subida');
    }

    const { uploadURL, id } = signPayload.data as { uploadURL: string; id: string };
    await uploadToCloudflare(uploadURL, file, onProgress);

    if (options?.requireSignedURLs) {
      // Caller must mint a signed URL server-side via signImageDeliveryUrl().
      return { id, url: '' };
    }
    const hash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
    if (!hash) throw new Error('NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH is not set');
    return { id, url: `https://imagedelivery.net/${hash}/${id}/public` };
  }

  /**
   * Upload a video to Cloudflare Stream via Direct Creator Upload, then poll
   * until transcoding is ready. Resolves with the final uid + metadata.
   */
  async function uploadVideo(
    file: File,
    options?: {
      maxDurationSeconds?: number;
      onProgress?: (progress: number) => void;
      onTranscode?: (state: string) => void;
      pollIntervalMs?: number;
      pollTimeoutMs?: number;
      source?: string;
      onUploaded?: (uid: string) => void;
    },
  ): Promise<CloudflareStreamUploadResult> {
    if (!file.type.startsWith('video/')) {
      throw new Error('uploadVideo called with a non-video file');
    }
    // Cloudflare Stream basic (non-tus) direct uploads cap at 200 MB.
    if (file.size > MAX_VIDEO_BYTES) {
      throw new Error(
        `El video "${file.name}" pesa ${formatBytes(file.size)} y supera el máximo de ${formatBytes(MAX_VIDEO_BYTES)}. Comprímelo e inténtalo de nuevo.`,
      );
    }

    const signRes = await fetch('/api/upload/video-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        maxDurationSeconds: options?.maxDurationSeconds,
        meta: { filename: file.name, ...(options?.source ? { source: options.source } : {}) },
      }),
    });
    const signPayload = await signRes.json().catch(() => null);
    if (!signRes.ok || !signPayload?.data?.uploadURL) {
      throw new Error(signPayload?.error || 'No se pudo generar la URL de subida');
    }

    const { uploadURL, uid } = signPayload.data as { uploadURL: string; uid: string };
    await uploadToCloudflare(uploadURL, file, options?.onProgress);
    options?.onUploaded?.(uid);

    // Poll until Stream reports readyToStream.
    const intervalMs = options?.pollIntervalMs ?? 3000;
    const timeoutMs = options?.pollTimeoutMs ?? 10 * 60 * 1000; // 10 min
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, intervalMs));
      const statusRes = await fetch(`/api/upload/video-status/${uid}`);
      const statusPayload = await statusRes.json().catch(() => null);
      if (!statusRes.ok || !statusPayload?.data) continue;
      const {
        state,
        readyToStream,
        duration,
        thumbnail,
      } = statusPayload.data as {
        state: string;
        readyToStream: boolean;
        duration: number;
        thumbnail: string;
      };
      options?.onTranscode?.(state);
      if (state === 'error') throw new Error('Cloudflare Stream transcoding failed');
      if (readyToStream) {
        return { uid, readyToStream: true, duration, thumbnail };
      }
    }
    throw new Error('Cloudflare Stream transcoding timed out');
  }


  return { uploadImage, uploadVideo };
}
