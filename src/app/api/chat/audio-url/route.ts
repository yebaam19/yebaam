import { NextResponse, type NextRequest } from 'next/server';
import { getVerifiedUserId } from '@/utils/supabase/server';
import { getPresignedUploadUrl } from '@/lib/cloudflare/r2';
import { MAX_CHAT_AUDIO_BYTES, formatBytes } from '@/lib/upload-limits';
import { checkRateLimit } from '@/lib/api/rate-limit';

// Chat voice notes / audio. Separate from /api/upload/audio-url (which is tied
// to the music club: `tracks/…` keys + the music_tracks rate limit). Chat audio
// lives under its own `chat-audio/…` prefix with no music coupling.
const ALLOWED = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/aac',
  'audio/wav',
]);
const EXT: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/aac': 'aac',
  'audio/wav': 'wav',
};

/** A voice note per few seconds is normal; a signing loop is not. */
const SIGN_LIMIT = { limit: 120, windowMs: 60 * 60 * 1000 };

export async function POST(request: NextRequest) {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rate = checkRateLimit(`chat:audio-url:${userId}`, SIGN_LIMIT);
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many upload requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.resetAt - Date.now()) / 1000)) } },
    );
  }

  let contentType = '';
  let size: unknown;
  try {
    const body = (await request.json()) as { contentType?: string; size?: unknown } | null;
    contentType = body?.contentType ?? '';
    size = body?.size;
  } catch {
    /* fall through to validation */
  }
  // MediaRecorder reports e.g. "audio/webm;codecs=opus" — sign the base mime.
  const base = contentType.split(';')[0].trim().toLowerCase();
  if (!ALLOWED.has(base)) {
    return NextResponse.json(
      { error: `Unsupported audio type. Allowed: ${Array.from(ALLOWED).join(', ')}` },
      { status: 400 },
    );
  }

  // Required, not optional: an unbound ContentLength signs a PUT that accepts a
  // body of any size, and the client-side cap in chatR2Upload.ts is not reached
  // by a caller crafting this request directly.
  if (!Number.isInteger(size) || (size as number) <= 0) {
    return NextResponse.json({ error: 'size (bytes) required' }, { status: 400 });
  }
  if ((size as number) > MAX_CHAT_AUDIO_BYTES) {
    return NextResponse.json(
      { error: `El audio supera el máximo de ${formatBytes(MAX_CHAT_AUDIO_BYTES)}.` },
      { status: 400 },
    );
  }

  const year = new Date().getUTCFullYear();
  const key = `chat-audio/${year}/${crypto.randomUUID()}.${EXT[base]}`;
  try {
    const { url } = await getPresignedUploadUrl(key, base, 300, size as number);
    return NextResponse.json({ url, key, mime: base });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not sign upload URL' },
      { status: 500 },
    );
  }
}
