export interface UploadUrlRequestDTO {
  fileName: string;
  fileType: string;
  fileSize: number;
  postId?: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
  cloudFrontUrl: string;
}

export interface UploadResult {
  url: string;
  s3Key: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  type: 'image' | 'video';
  /** Populated for videos uploaded to Cloudflare Stream. */
  streamUid?: string;
  /** Populated for videos; thumbnail image URL returned by Cloudflare Stream. */
  thumbnailUrl?: string;
  /** Populated for videos; duration in seconds. */
  duration?: number;
}

export interface CloudflareImageUploadResult {
  id: string;
  url: string;
}

export interface CloudflareStreamUploadResult {
  uid: string;
  readyToStream: boolean;
  duration: number;
  thumbnail: string;
}

async function uploadToCloudflare(
  uploadURL: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        try {
          const err = JSON.parse(xhr.responseText || '{}');
          reject(new Error(err?.errors?.[0]?.message || `Cloudflare upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Cloudflare upload failed (${xhr.status})`));
        }
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Network error during Cloudflare upload')));
    xhr.open('POST', uploadURL);
    xhr.send(form);
  });
}

export class UploadService {
  /**
   * Upload an image using Cloudflare Images Direct Creator Upload.
   * Returns the CF image id plus the full delivery URL (public variant).
   * For sensitive content (ID documents), enforce privacy at the DB layer
   * (RLS) — never expose the cf id to non-authorized users.
   */
  async uploadImage(
    file: File,
    onProgress?: (progress: number) => void,
    options?: {
      metadata?: Record<string, string>;
      /** Required for KYC photos / ID documents. When true, the returned `url` is null
       *  (the image cannot be fetched without a server-minted signed URL). */
      requireSignedURLs?: boolean;
    },
  ): Promise<CloudflareImageUploadResult> {
    if (!file.type.startsWith('image/')) {
      throw new Error('uploadImage called with a non-image file');
    }

    const signRes = await fetch('/api/upload/image-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metadata: { filename: file.name, ...(options?.metadata ?? {}) },
        requireSignedURLs: options?.requireSignedURLs === true,
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
  async uploadVideo(
    file: File,
    options?: {
      maxDurationSeconds?: number;
      onProgress?: (progress: number) => void;
      onTranscode?: (state: string) => void;
      pollIntervalMs?: number;
      pollTimeoutMs?: number;
    },
  ): Promise<CloudflareStreamUploadResult> {
    if (!file.type.startsWith('video/')) {
      throw new Error('uploadVideo called with a non-video file');
    }

    const signRes = await fetch('/api/upload/video-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        maxDurationSeconds: options?.maxDurationSeconds,
        meta: { filename: file.name },
      }),
    });
    const signPayload = await signRes.json().catch(() => null);
    if (!signRes.ok || !signPayload?.data?.uploadURL) {
      throw new Error(signPayload?.error || 'No se pudo generar la URL de subida');
    }

    const { uploadURL, uid } = signPayload.data as { uploadURL: string; uid: string };
    await uploadToCloudflare(uploadURL, file, options?.onProgress);

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

  async getUploadUrl(_data: UploadUrlRequestDTO): Promise<UploadUrlResponse> {
    throw new Error(
      'Presigned URL uploads are no longer supported. Use uploadService.uploadFile(file) which posts to /api/upload.',
    );
  }

  async uploadFileToUrl(
    _file: File,
    _uploadUrl: string,
    _onProgress?: (progress: number) => void,
  ): Promise<void> {
    throw new Error(
      'Direct S3 PUT is no longer supported. Use uploadService.uploadFile(file) which posts to /api/upload.',
    );
  }

  async uploadFile(
    file: File,
    _postId?: string,
    onProgress?: (progress: number) => void,
  ): Promise<UploadResult> {
    if (file.type.startsWith('video/')) {
      const { uid, duration, thumbnail } = await this.uploadVideo(file, { onProgress });
      return {
        url: `https://iframe.videodelivery.net/${uid}`,
        s3Key: uid,
        streamUid: uid,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        type: 'video',
        thumbnailUrl: thumbnail,
        duration,
      };
    }

    const { id, url } = await this.uploadImage(file, onProgress);
    return {
      url,
      s3Key: id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      type: 'image',
    };
  }

  async uploadMultipleFiles(
    files: File[],
    postId?: string,
    onProgress?: (fileIndex: number, progress: number) => void,
  ): Promise<UploadResult[]> {
    return Promise.all(
      files.map((file, index) =>
        this.uploadFile(file, postId, onProgress ? (p) => onProgress(index, p) : undefined),
      ),
    );
  }
}

export const uploadService = new UploadService();
