import { NextResponse, type NextRequest } from 'next/server';
import { requirePlatformAdmin } from '@/features/music-archive/server/music.server';
import { MUSIC_CLUB_ENABLED } from '@/features/music-archive/config';
import { getServiceClient } from '@/utils/supabase/server';
import { getDownloadUrl } from '@/lib/cloudflare/r2';
import { safeZipName } from '@/lib/zip/store-zip';
import type { MusicTrackRow } from '@/features/music-archive/types/music.types';

/**
 * Admin-only single-track download. Redirects to a short-lived presigned R2 URL
 * carrying a `Content-Disposition` built from the track's real title, so the
 * bytes go browser ⇄ Cloudflare directly instead of through this function.
 *
 * The album-wide `.zip` (../../albums/[id]/download) is the usual path; this one
 * covers "solo esta canción" and discs too large for a non-Zip64 archive.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  // Same kill switch the proxy applies to /admin/music/** — see the album route.
  if (!MUSIC_CLUB_ENABLED) {
    return NextResponse.json({ error: 'No encontrado.' }, { status: 404 });
  }

  const admin = await requirePlatformAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Solo administradores.' }, { status: 403 });
  }

  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Identificador de pista inválido.' }, { status: 400 });
  }

  const service = getServiceClient();
  const { data, error } = await service
    .from('music_tracks')
    .select('id, title, position, side, format, r2_key, album_id')
    .eq('id', id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Pista no encontrada.' }, { status: 404 });

  const track = data as Pick<
    MusicTrackRow,
    'id' | 'title' | 'position' | 'side' | 'format' | 'r2_key' | 'album_id'
  >;
  const number = track.side
    ? `${track.side.toUpperCase()}${track.position}`
    : String(track.position).padStart(2, '0');
  const filename = `${number} - ${safeZipName(track.title, 'pista')}.${track.format || 'mp3'}`;

  console.info('[admin track download]', {
    actorId: admin.userId,
    trackId: track.id,
    albumId: track.album_id,
  });

  try {
    const url = await getDownloadUrl(track.r2_key, filename);
    return NextResponse.redirect(url, 302);
  } catch (err) {
    console.error('[admin track download] presign failed', { trackId: track.id, err });
    return NextResponse.json(
      { error: 'No se pudo firmar la URL de descarga.' },
      { status: 500 },
    );
  }
}
