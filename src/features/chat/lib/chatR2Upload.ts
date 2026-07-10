import { uploadToPresignedUrl } from '@/lib/service/upload.service';

/** Client-side limits for chat attachments. The file cap mirrors the
 *  server-side check in /api/chat/file-url (which also binds the declared size
 *  into the presigned PUT's signature). */
export const CHAT_AUDIO_MAX_BYTES = 25 * 1024 * 1024;
export const CHAT_FILE_MAX_BYTES = 25 * 1024 * 1024;

// Base mimes accepted by /api/chat/audio-url. Browsers report a few aliases
// (Chrome gives .m4a files as audio/x-m4a) — normalize before signing.
const AUDIO_MIME_ALIASES: Record<string, string> = {
  'audio/x-m4a': 'audio/mp4',
  'audio/m4a': 'audio/mp4',
  'audio/mp3': 'audio/mpeg',
  'audio/x-wav': 'audio/wav',
  'audio/wave': 'audio/wav',
};
const CHAT_AUDIO_MIMES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/aac',
  'audio/wav',
]);

export const CHAT_AUDIO_ACCEPT = 'audio/*,.mp3,.m4a,.wav,.ogg,.aac,.webm';

/** Returns the signable base mime for a chat audio file, or null when the
 *  audio-url route would reject it. */
export function normalizeChatAudioMime(rawType: string): string | null {
  const base = rawType.split(';')[0].trim().toLowerCase();
  const mime = AUDIO_MIME_ALIASES[base] ?? base;
  return CHAT_AUDIO_MIMES.has(mime) ? mime : null;
}

// Extension is authoritative for documents: browsers report inconsistent mimes
// (Windows gives .zip as application/x-zip-compressed, .txt sometimes empty).
const CHAT_DOC_MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  zip: 'application/zip',
};

export const CHAT_DOC_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip';

/** Maps a document filename to the mime /api/chat/file-url accepts, or null
 *  when the extension is not an allowed chat document type. */
export function chatDocMime(fileName: string): string | null {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return CHAT_DOC_MIME_BY_EXT[ext] ?? null;
}

/**
 * Sign against a chat-scoped presign route (`/api/chat/audio-url` or
 * `/api/chat/file-url`) and PUT the body to R2. The PUT travels through
 * `uploadToPresignedUrl` (upload.service.ts): the same XHR transport with
 * abort/timeout/error as uploadAudio — a raw `fetch` without timeout was the
 * class of hang behind the album-upload incident. If the transport fails it is
 * retried ONCE with a fresh signature; sign-endpoint errors are thrown
 * immediately (they are not transient).
 */
export async function uploadToChatR2(
  signRoute: string,
  signPayload: Record<string, unknown>,
  body: Blob | File,
  fallbackMime: string,
  onProgress?: (progress: number) => void,
): Promise<{ key: string; mime: string }> {
  const maxAttempts = 2;
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const signRes = await fetch(signRoute, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(signPayload),
    });
    const signed = (await signRes.json().catch(() => null)) as
      | { url?: string; key?: string; mime?: string; error?: string }
      | null;
    if (!signRes.ok || !signed?.url || !signed?.key) {
      throw new Error(signed?.error || 'Could not get upload URL');
    }

    try {
      await uploadToPresignedUrl(signed.url, body, signed.mime ?? fallbackMime, onProgress);
      return { key: signed.key, mime: signed.mime ?? fallbackMime };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Chat upload failed');
}
