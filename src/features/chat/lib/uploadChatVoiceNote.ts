import type { MessageMedia } from '../types';
import { MediaType } from '../types';

/**
 * Upload a recorded voice note to R2 via a chat-scoped presigned PUT, and return
 * the MessageMedia to attach to the message. The PUT's Content-Type must match
 * the base mime the route signed, so we send `mime` (no codecs) on both sides.
 */
export async function uploadChatVoiceNote(
  blob: Blob,
  mime: string,
  durationSeconds: number,
): Promise<MessageMedia> {
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

  const putRes = await fetch(signed.url, {
    method: 'PUT',
    headers: { 'Content-Type': signed.mime ?? mime },
    body: blob,
  });
  if (!putRes.ok) throw new Error(`Audio upload failed (${putRes.status})`);

  return {
    type: MediaType.AUDIO,
    r2_key: signed.key,
    mime: signed.mime ?? mime,
    duration: Math.round(durationSeconds),
    size: blob.size,
  };
}
