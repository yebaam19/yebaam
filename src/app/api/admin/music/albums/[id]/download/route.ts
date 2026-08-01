import { NextResponse, type NextRequest } from 'next/server';
import { requirePlatformAdmin } from '@/features/music-archive/server/music.server';
import { buildAlbumDownload } from '@/features/music-archive/server/album-download.server';
import { MUSIC_CLUB_ENABLED } from '@/features/music-archive/config';
import { attachmentDisposition } from '@/lib/http/content-disposition';
import { createStoreZipStream } from '@/lib/zip/store-zip';

/**
 * Admin-only album export: streams the whole disc (audio from R2 + cover art
 * from Cloudflare Images + a plain-text data sheet) as one `.zip`.
 *
 * Why a route handler and not a Server Action: the response IS the file, and it
 * has to stream — a Server Action would have to buffer the archive and hand it
 * back through the RSC channel.
 *
 * Access: `requirePlatformAdmin()` only. The proxy's matcher skips `/api/**`,
 * so this route does its own session check; contributors and club owners get a
 * 403 here, exactly like the rest of `/admin/music`.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  // The proxy 404s /musica/** and /admin/music/** behind this kill switch, but
  // its matcher skips /api/**, so the route enforces it itself.
  if (!MUSIC_CLUB_ENABLED) {
    return NextResponse.json({ error: 'No encontrado.' }, { status: 404 });
  }

  const admin = await requirePlatformAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Solo administradores.' }, { status: 403 });
  }

  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Identificador de álbum inválido.' }, { status: 400 });
  }

  const built = await buildAlbumDownload(id, admin.userId);
  if (!built.ok) {
    return NextResponse.json({ error: built.error }, { status: built.status });
  }
  const { plan } = built;

  // Audit trail for an admin reading another collector's contribution. Lands in
  // the platform logs before a single byte of audio leaves the bucket.
  console.info('[admin album download]', {
    actorId: admin.userId,
    albumId: id,
    filename: plan.filename,
    tracks: plan.trackCount,
    availableTracks: plan.availableTracks,
    audioBytes: plan.totalAudioBytes,
  });

  const zip = createStoreZipStream(plan.entries, { onEntryError: plan.recordFailure });

  return new Response(zip, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': attachmentDisposition(plan.filename, 'disco.zip'),
      // No Content-Length: the archive's size isn't known until it has streamed.
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
