import { NextResponse, type NextRequest } from 'next/server';
import { getVerifiedUserId } from '@/utils/supabase/server';
import { createStreamDirectUploadUrl } from '@/lib/cloudflare/stream';
import { checkRateLimit } from '@/lib/api/rate-limit';

const DEFAULT_MAX_DURATION_SECONDS = 60 * 60 * 4; // 4 hours — matches Facebook's feed video limit.
const HARD_CAP_SECONDS = 60 * 60 * 4; // 4 h hard cap, reject anything larger.

/** Same shape as /api/upload/image-url: a burst of uploads, not a credential-farming loop. */
const UPLOAD_URL_LIMIT = { limit: 60, windowMs: 60 * 60 * 1000 };

export async function POST(request: NextRequest) {
  // Verified identity, not cookie presence: this route spends the account-wide
  // CLOUDFLARE_API_TOKEN and never touches Postgres (see image-url route).
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rate = checkRateLimit(`upload:video-url:${userId}`, UPLOAD_URL_LIMIT);
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many upload requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.resetAt - Date.now()) / 1000)) } },
    );
  }

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
