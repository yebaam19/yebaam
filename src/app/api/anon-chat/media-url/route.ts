import { NextResponse, type NextRequest } from 'next/server';
import { getServerAccessToken } from '@/utils/supabase/server';
import { signImageDeliveryUrl } from '@/lib/cloudflare/images';

/**
 * Mint a short-lived (5 min) signed Cloudflare Images URL for an anonymous-chat
 * image. The image was uploaded with requireSignedURLs=true, so it can't be
 * fetched without this — that's what enforces the "vanishes after 5 minutes"
 * rule server-side (the signature's `exp` expires regardless of the client UI).
 */
export async function POST(request: NextRequest) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let cfId: string | undefined;
  try {
    const body = (await request.json()) as { cfId?: string } | null;
    if (typeof body?.cfId === 'string') cfId = body.cfId;
  } catch {
    /* no body */
  }
  if (!cfId) return NextResponse.json({ error: 'cfId required' }, { status: 400 });

  try {
    const url = await signImageDeliveryUrl(cfId, { expirySeconds: 300 });
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'sign failed' }, { status: 500 });
  }
}
