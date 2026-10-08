import { createMediaUploads } from './uploads/media';
import { createR2Uploads } from './uploads/r2';
import type { UploadResult } from './uploads/types';
export type * from './uploads/types';
export { detectAudioDuration } from './uploads/r2';

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

export class UploadService {
  uploadImage = createMediaUploads(uploadToCloudflare).uploadImage;
  uploadVideo = createMediaUploads(uploadToCloudflare).uploadVideo;
  uploadAudio = createR2Uploads(putToR2).uploadAudio;
  uploadDocument = createR2Uploads(putToR2).uploadDocument;

  async uploadFile(
    file: File,
    _postId?: string,
    onProgress?: (progress: number) => void,
    options?: { source?: string },
  ): Promise<UploadResult> {
    if (file.type.startsWith('video/')) {
      const { uid, duration, thumbnail } = await this.uploadVideo(file, { onProgress, source: options?.source });
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
