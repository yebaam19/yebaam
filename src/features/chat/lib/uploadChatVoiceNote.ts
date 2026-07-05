import { uploadToPresignedUrl } from '@/lib/service/upload.service';
import type { MessageMedia } from '../types';
import { MediaType } from '../types';

/**
 * Upload a recorded voice note to R2 via a chat-scoped presigned PUT, and return
 * the MessageMedia to attach to the message. The PUT's Content-Type must match
 * the base mime the route signed, so we send `mime` (no codecs) on both sides.
 *
 * El PUT viaja por `uploadToPresignedUrl` (upload.service.ts): el mismo
 * transporte XHR con abort/timeout/error que uploadAudio — un `fetch` crudo
 * sin timeout fue la clase de cuelgue del incidente de subida de álbumes. Si
 * el transporte falla se reintenta UNA vez con una firma fresca; los errores
 * del endpoint de firma se lanzan de inmediato (no son transitorios).
 */
export async function uploadChatVoiceNote(
  blob: Blob,
  mime: string,
  durationSeconds: number,
): Promise<MessageMedia> {
  const maxAttempts = 2;
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const signRes = await fetch('/api/chat/audio-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ contentType: mime }),
    });
    const signed = (await signRes.json().catch(() => null)) as
      | { url?: string; key?: string; mime?: string; error?: string }
      | null;
    if (!signRes.ok || !signed?.url || !signed?.key) {
      throw new Error(signed?.error || 'Could not get upload URL');
    }

    try {
      await uploadToPresignedUrl(signed.url, blob, signed.mime ?? mime);
      return {
        type: MediaType.AUDIO,
        r2_key: signed.key,
        mime: signed.mime ?? mime,
        duration: Math.round(durationSeconds),
        size: blob.size,
      };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Audio upload failed');
}
