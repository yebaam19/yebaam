import { NextResponse, type NextRequest } from 'next/server';
import { getServerAccessToken } from '@/utils/supabase/server';
import { getPresignedUploadUrl } from '@/lib/cloudflare/r2';

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

export async function POST(request: NextRequest) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let contentType = '';
  try {
    const body = (await request.json()) as { contentType?: string } | null;
    contentType = body?.contentType ?? '';
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

  const year = new Date().getUTCFullYear();
  const key = `chat-audio/${year}/${crypto.randomUUID()}.${EXT[base]}`;
  try {
    const { url } = await getPresignedUploadUrl(key, base, 300);
    return NextResponse.json({ url, key, mime: base });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not sign upload URL' },
      { status: 500 },
    );
  }
}
