import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { getPresignedUploadUrl } from '@/lib/cloudflare/r2';

const ALLOWED_MIMES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/flac',
  'audio/x-flac',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/ogg',
]);

const MIME_TO_EXT: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/flac': 'flac',
  'audio/x-flac': 'flac',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
  'audio/ogg': 'ogg',
};

const RATE_LIMIT_PER_HOUR = 50;

export async function POST(request: NextRequest) {
  const client = await getServerClient();
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let contentType: string;
  try {
    const body = (await request.json()) as { contentType?: string } | null;
    contentType = body?.contentType ?? '';
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!contentType || !ALLOWED_MIMES.has(contentType)) {
    return NextResponse.json(
      { error: `Unsupported audio type. Allowed: ${Array.from(ALLOWED_MIMES).join(', ')}` },
      { status: 400 },
    );
  }

  // Rate limit: count tracks created in the last hour by this user.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await client
    .from('music_tracks')
    .select('id', { count: 'exact', head: true })
    .eq('contributed_by', userData.user.id)
    .gte('created_at', oneHourAgo);
  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
    return NextResponse.json(
      { error: `Has alcanzado el límite de ${RATE_LIMIT_PER_HOUR} subidas por hora. Intenta más tarde.` },
      { status: 429 },
    );
  }

  const ext = MIME_TO_EXT[contentType];
  const year = new Date().getUTCFullYear();
  const uuid = crypto.randomUUID();
  const key = `tracks/${year}/${uuid}.${ext}`;

  try {
    const { url } = await getPresignedUploadUrl(key, contentType, 300);
    return NextResponse.json({ success: true, data: { url, key } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'No se pudo firmar la URL';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
