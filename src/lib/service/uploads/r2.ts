import { MAX_AUDIO_BYTES, MAX_DOCUMENT_BYTES, formatBytes } from '@/lib/upload-limits';
import { documentContentType } from '@/lib/upload-documents';
import type { R2AudioUploadResult, R2DocumentUploadResult, R2Upload, CommunityDocumentUploadOptions } from './types';

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

export function createR2Uploads(putToR2: R2Upload) {
  /**
   * Upload an audio file (MP3 / FLAC / WAV / OGG) to Cloudflare R2 via a
   * presigned PUT URL. Detects duration client-side. Returns the R2 key plus
   * detected metadata; the caller is responsible for storing the key in DB.
   */
  async function uploadAudio(
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
  async function uploadDocument(
    file: File,
    onProgress?: (progress: number) => void,
    options?: CommunityDocumentUploadOptions,
  ): Promise<R2DocumentUploadResult> {
    const contentType = options ? documentContentType(file.name, file.type) : file.type;
    if (!contentType || (!options && contentType !== 'application/pdf')) {
      throw new Error(options ? 'El formato del documento no es compatible.' : 'Solo se permiten documentos PDF.');
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
      const endpoint = options ? `/api/communities/${encodeURIComponent(options.communityId)}/documents/upload-url` : '/api/upload/file-url';
      const signRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, sizeBytes: file.size, ...(options ? { uploadId: options.uploadId, fileName: file.name } : {}) }),
      });
      const signPayload = await signRes.json().catch(() => null);
      if (!signRes.ok || !signPayload?.data?.url) {
        throw new Error(signPayload?.error || 'No se pudo generar la URL de subida del documento');
      }
      const { url, key } = signPayload.data as { url: string; key: string };

      try {
        await putToR2(url, file, contentType, onProgress);
        return { key, sizeBytes: file.size, contentType };
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('No se pudo subir el documento. Revisa tu conexión e inténtalo de nuevo.');
  }


  return { uploadAudio, uploadDocument };
}
