import { NextResponse, type NextRequest } from 'next/server';
import { getServerAccessToken, getServerClient } from '@/utils/supabase/server';
import { createStreamDirectUploadUrl } from '@/lib/cloudflare/stream';

const DEFAULT_MAX_DURATION_SECONDS = 60 * 30; // 30 minutes — hard ceiling; client can request less.
const HARD_CAP_SECONDS = 60 * 60 * 2; // 2 h, reject anything larger.

export async function POST(request: NextRequest) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let maxDurationSeconds = DEFAULT_MAX_DURATION_SECONDS;
  let meta: Record<string, string> | undefined;
  try {
    const body = (await request.json()) as {
      maxDurationSeconds?: number;
      meta?: Record<string, string>;
    } | null;
    if (typeof body?.maxDurationSeconds === 'number' && body.maxDurationSeconds > 0) {
      maxDurationSeconds = Math.min(body.maxDurationSeconds, HARD_CAP_SECONDS);
    }
    if (body?.meta && typeof body.meta === 'object') meta = body.meta;
  } catch {
    // No body — defaults apply.
  }

  try {
    const result = await createStreamDirectUploadUrl({
      maxDurationSeconds,
      meta: { ...meta, uploadedBy: userId },
    });
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create upload URL';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
