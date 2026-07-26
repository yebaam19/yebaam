import { NextResponse, type NextRequest } from 'next/server';
import { getVerifiedUserId } from '@/utils/supabase/server';
import {
  deleteImage,
  getImageProvenance,
  isCloudflareImageId,
  CF_SOURCE_ANON_CHAT,
} from '@/lib/cloudflare/images';

/**
 * Hard-delete an anonymous-chat image from Cloudflare. Called by the sender's
 * client when the chat closes (or the 5-min window elapses), so no media record
 * outlives the ephemeral conversation. Best-effort; the short signed-URL expiry
 * already makes the asset unviewable meanwhile.
 *
 * Ownership is checked against Cloudflare's own metadata rather than a database
 * row, because ephemeral chat media deliberately has no row. `/api/upload/image-url`
 * stamps `uploadedBy` from the verified session at mint time, so an id the
 * caller did not upload cannot be deleted here — Cloudflare image ids are
 * public (every `imagedelivery.net/<hash>/<id>/<variant>` URL on the site spells
 * one out), so without this check the route deletes any image on the platform.
 */
export async function POST(request: NextRequest) {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let cfId: string | undefined;
  try {
    const body = (await request.json()) as { cfId?: string } | null;
    if (typeof body?.cfId === 'string') cfId = body.cfId;
  } catch {
    /* no body */
  }
  if (!cfId) return NextResponse.json({ error: 'cfId required' }, { status: 400 });
  if (!isCloudflareImageId(cfId)) {
    return NextResponse.json({ error: 'Invalid cfId' }, { status: 400 });
  }

  try {
    const provenance = await getImageProvenance(cfId);
    // A missing image, an image from another surface, or one uploaded by
    // somebody else all collapse to the same answer — deliberately, so this
    // route cannot be used to probe which ids exist.
    if (
      !provenance ||
      provenance.source !== CF_SOURCE_ANON_CHAT ||
      provenance.uploadedBy !== userId
    ) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await deleteImage(cfId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'delete failed' }, { status: 500 });
  }
}
