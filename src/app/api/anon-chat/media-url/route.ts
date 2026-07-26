import { NextResponse, type NextRequest } from 'next/server';
import { getVerifiedUserId } from '@/utils/supabase/server';
import {
  signImageDeliveryUrl,
  getImageProvenance,
  isCloudflareImageId,
  CF_SOURCE_ANON_CHAT,
} from '@/lib/cloudflare/images';

/**
 * Mint a short-lived (5 min) signed Cloudflare Images URL for an anonymous-chat
 * image. The image was uploaded with requireSignedURLs=true, so it can't be
 * fetched without this — that's what enforces the "vanishes after 5 minutes"
 * rule server-side (the signature's `exp` expires regardless of the client UI).
 *
 * Scope note: this route cannot check ownership the way media-delete does — the
 * *receiver* of an ephemeral image legitimately needs a URL for media they did
 * not upload, and an anonymous chat is Broadcast-only, so there is no
 * membership record on the server to check against. What it can do, and now
 * does, is refuse to sign anything that is not an anon-chat image. Without that
 * this endpoint is a signing oracle for every private image in the account,
 * including the KYC identity documents and badge evidence that are uploaded
 * with requireSignedURLs precisely so they stay admin-only.
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
    if (!provenance || provenance.source !== CF_SOURCE_ANON_CHAT) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const url = await signImageDeliveryUrl(cfId, { expirySeconds: 300 });
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'sign failed' }, { status: 500 });
  }
}
