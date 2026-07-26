import {
  MAX_AUDIO_BYTES,
  MAX_DOCUMENT_BYTES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  formatBytes,
} from '@/lib/upload-limits';

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

export interface R2AudioUploadResult {
  key: string;
  durationSeconds: number;
  sizeBytes: number;
  contentType: string;
}

export interface R2DocumentUploadResult {
  key: string;
  sizeBytes: number;
  contentType: string;
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
    // Without these the promise never settles on an interrupted request and
    // the calling form spins forever.
    xhr.addEventListener('abort', () => reject(new Error('Cloudflare upload was interrupted')));
    xhr.addEventListener('timeout', () => reject(new Error('Cloudflare upload timed out')));
    xhr.open('POST', uploadURL);
    xhr.send(form);
  });
}

/** R2 expects a raw PUT, not multipart. Different shape from CF Images.
 *  Acepta File o Blob (las notas de voz llegan como Blob del MediaRecorder);
 *  el Content-Type viaja por parámetro porque debe coincidir con el mime que
 *  firmó el endpoint (un Blob puede traer `;codecs=` en su `type`). */
async function putToR2(
  presignedUrl: string,
  body: File | Blob,
  contentType: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`R2 upload failed (${xhr.status})`));
    });
    xhr.addEventListener('error', () => reject(new Error('Network error during R2 upload')));
    // Without these the promise never settles on an interrupted request and
    // the calling form spins forever.
    xhr.addEventListener('abort', () => reject(new Error('R2 upload was interrupted')));
    xhr.addEventListener('timeout', () => reject(new Error('R2 upload timed out')));
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.send(body);
  });
}

/**
 * Transporte compartido para PUTs a URLs prefirmadas de R2 (el XHR vive solo
 * en este archivo — regla ESLint). abort/timeout/error siempre asientan la
 * promesa: un `fetch` crudo sin timeout fue la clase de cuelgue del incidente
 * de subida de álbumes.
 */
export async function uploadToPresignedUrl(
  presignedUrl: string,
  body: File | Blob,
  contentType: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return putToR2(presignedUrl, body, contentType, onProgress);
}

/**
 * Best-effort duration probe. Chrome throttles media loading in background
 * tabs, so `loadedmetadata` may never fire — the timeout guarantees this
 * promise ALWAYS settles. Duration is optional metadata; it must never be
 * able to hang an upload pipeline (that freeze looked like "uploads stopped
 * working" to users who switched tabs while a big file uploaded).
 */
export async function detectAudioDuration(file: File, timeoutMs = 8000): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    let settled = false;
    const settle = (d: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(d);
    };
    const timer = setTimeout(() => settle(0), timeoutMs);
    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', () =>
      settle(Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0),
    );
    audio.addEventListener('error', () => settle(0));
    audio.src = url;
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

  /**
   * Upload an audio file (MP3 / FLAC / WAV / OGG) to Cloudflare R2 via a
   * presigned PUT URL. Detects duration client-side. Returns the R2 key plus
   * detected metadata; the caller is responsible for storing the key in DB.
   */
  async uploadAudio(
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<R2AudioUploadResult> {
    if (!file.type.startsWith('audio/')) {
      throw new Error('uploadAudio called with a non-audio file');
    }
    // The server rejects >200 MB after the upload (R2 HEAD) — fail here first,
    // so the user doesn't wait out a long upload only to get the same error.
    if (file.size > MAX_AUDIO_BYTES) {
      throw new Error(
        `"${file.name}" pesa ${formatBytes(file.size)} y supera el máximo de ${formatBytes(MAX_AUDIO_BYTES)} por canción.`,
      );
    }

    // Detect duration in parallel with the upload. It can only delay
    // completion by a short grace period after the PUT finishes — never hang it.
    const durationPromise = detectAudioDuration(file);

    // Long uploads on slow connections can drop mid-flight; retry the PUT once
    // with a freshly signed URL. Sign-endpoint errors (401/429/500) are not
    // transient upload failures — surface those immediately.
    const maxAttempts = 2;
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const signRes = await fetch('/api/upload/audio-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, sizeBytes: file.size }),
      });
      const signPayload = await signRes.json().catch(() => null);
      if (!signRes.ok || !signPayload?.data?.url) {
        throw new Error(signPayload?.error || 'No se pudo generar la URL de subida de audio');
      }
      const { url, key } = signPayload.data as { url: string; key: string };

      try {
        await putToR2(url, file, file.type, onProgress);
        const durationSeconds = await Promise.race([
          durationPromise,
          new Promise<number>((r) => setTimeout(() => r(0), 1500)),
        ]);
        return {
          key,
          durationSeconds,
          sizeBytes: file.size,
          contentType: file.type,
        };
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('No se pudo subir el audio. Revisa tu conexión e inténtalo de nuevo.');
  }

  /**
   * Sube un documento PDF (CV de servicios profesionales) a Cloudflare R2 vía
   * URL prefirmada de /api/upload/file-url. Devuelve la clave R2 desnuda
   * (`cvs/AAAA/uuid.pdf`) — el caller guarda la CLAVE en DB, nunca la URL
   * firmada (la URL de lectura se resuelve al renderizar).
   */
  async uploadDocument(
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<R2DocumentUploadResult> {
    if (file.type !== 'application/pdf') {
      throw new Error('Solo se permiten documentos PDF.');
    }
    // El servidor rechaza >10 MB al firmar — fallar aquí primero, con el
    // mismo mensaje formateado, evita el roundtrip.
    if (file.size > MAX_DOCUMENT_BYTES) {
      throw new Error(
        `"${file.name}" pesa ${formatBytes(file.size)} y supera el máximo de ${formatBytes(MAX_DOCUMENT_BYTES)} por documento.`,
      );
    }

    // Misma disciplina que uploadAudio (sin sonda de duración): un PUT caído
    // se reintenta UNA vez con URL recién firmada; los errores del endpoint de
    // firma (401/403/429/500) no son transitorios y se lanzan de inmediato.
    const maxAttempts = 2;
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const signRes = await fetch('/api/upload/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, sizeBytes: file.size }),
      });
      const signPayload = await signRes.json().catch(() => null);
      if (!signRes.ok || !signPayload?.data?.url) {
        throw new Error(signPayload?.error || 'No se pudo generar la URL de subida del documento');
      }
      const { url, key } = signPayload.data as { url: string; key: string };

      try {
        await putToR2(url, file, file.type, onProgress);
        return { key, sizeBytes: file.size, contentType: file.type };
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('No se pudo subir el documento. Revisa tu conexión e inténtalo de nuevo.');
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
    options?: { source?: string },
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

    const { id, url } = await this.uploadImage(file, onProgress, { source: options?.source });
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
