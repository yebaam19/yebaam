import { NextResponse, type NextRequest } from 'next/server';
import { getServerAccessToken } from '@/utils/supabase/server';
import { deleteImage } from '@/lib/cloudflare/images';

/**
 * Hard-delete an anonymous-chat image from Cloudflare. Called by the sender's
 * client when the chat closes (or the 5-min window elapses), so no media record
 * outlives the ephemeral conversation. Best-effort; the short signed-URL expiry
 * already makes the asset unviewable meanwhile.
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
    await deleteImage(cfId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'delete failed' }, { status: 500 });
  }
}
