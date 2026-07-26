import type { MessageMedia } from '../types';
import { MediaType } from '../types';
import { uploadToChatR2 } from './chatR2Upload';

/**
 * Upload a recorded voice note to R2 via a chat-scoped presigned PUT, and return
 * the MessageMedia to attach to the message. The PUT's Content-Type must match
 * the base mime the route signed, so we send `mime` (no codecs) on both sides.
 *
 * El transporte (firma + PUT XHR + reintento con firma fresca) vive en
 * `uploadToChatR2` (chatR2Upload.ts), compartido con los adjuntos de audio y
 * documento del compositor.
 */
export async function uploadChatVoiceNote(
  blob: Blob,
  mime: string,
  durationSeconds: number,
): Promise<MessageMedia> {
  const { key, mime: storedMime } = await uploadToChatR2(
    '/api/chat/audio-url',
    { contentType: mime, size: blob.size },
    blob,
    mime,
  );
  return {
    type: MediaType.AUDIO,
    r2_key: key,
    mime: storedMime,
    duration: Math.round(durationSeconds),
    size: blob.size,
  };
}
