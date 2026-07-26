import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { getPresignedUploadUrl } from '@/lib/cloudflare/r2';
import { MAX_AUDIO_BYTES } from '@/lib/upload-limits';

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
  let sizeBytes: number | undefined;
  try {
    const body = (await request.json()) as { contentType?: string; sizeBytes?: number } | null;
    contentType = body?.contentType ?? '';
    if (typeof body?.sizeBytes === 'number' && Number.isFinite(body.sizeBytes)) {
      sizeBytes = Math.floor(body.sizeBytes);
    }
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!contentType || !ALLOWED_MIMES.has(contentType)) {
    return NextResponse.json(
      { error: `Unsupported audio type. Allowed: ${Array.from(ALLOWED_MIMES).join(', ')}` },
      { status: 400 },
    );
  }

  // Reject oversized files before any upload happens. The declared size is
  // also bound into the presigned URL below, so the client can't lie about it.
  //
  // `sizeBytes` is mandatory. While it was optional this whole check was
  // guarded by `!== undefined`, so a body of `{"contentType":"audio/mpeg"}`
  // skipped the cap *and* left ContentLength out of the signature — an
  // unlimited-size write credential. The hourly limiter below does not cover
  // that case either: it counts music_tracks rows, and an attacker who signs
  // without ever calling createTrack keeps a count of zero forever.
  if (sizeBytes === undefined) {
    return NextResponse.json({ error: 'sizeBytes required' }, { status: 400 });
  }
  if (sizeBytes <= 0 || sizeBytes > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: `El archivo supera el tamaño máximo permitido (${Math.round(MAX_AUDIO_BYTES / (1024 * 1024))} MB).` },
      { status: 400 },
    );
  }

  // Platform admins (the archive curators) upload whole albums back-to-back —
  // the abuse rate limit only applies to regular contributors.
  const { data: adminRow } = await client
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (!adminRow) {
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
  }

  const ext = MIME_TO_EXT[contentType];
  const year = new Date().getUTCFullYear();
  const uuid = crypto.randomUUID();
  const key = `tracks/${year}/${uuid}.${ext}`;

  try {
    // 15 min TTL: enough slack for slow devices between signing and the PUT
    // actually starting; expiry is only checked when the request starts.
    const { url } = await getPresignedUploadUrl(key, contentType, 900, sizeBytes);
    return NextResponse.json({ success: true, data: { url, key } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'No se pudo firmar la URL';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
