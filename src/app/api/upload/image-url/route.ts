import { NextResponse, type NextRequest } from 'next/server';
import { getVerifiedUserId } from '@/utils/supabase/server';
import { createImageDirectUploadUrl, CF_META_SOURCE, CF_META_UPLOADED_BY } from '@/lib/cloudflare/images';
import { checkRateLimit } from '@/lib/api/rate-limit';

/** Enough for a burst of gallery uploads, far short of a credential-farming loop. */
const UPLOAD_URL_LIMIT = { limit: 60, windowMs: 60 * 60 * 1000 };

export async function POST(request: NextRequest) {
  // Verified identity, not cookie presence: this route spends the account-wide
  // CLOUDFLARE_API_TOKEN and never touches Postgres, so nothing downstream
  // would catch a forged session.
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rate = checkRateLimit(`upload:image-url:${userId}`, UPLOAD_URL_LIMIT);
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many upload requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.resetAt - Date.now()) / 1000)) } },
    );
  }

  let metadata: Record<string, string> | undefined;
  let requireSignedURLs = false;
  let source: string | undefined;
  try {
    const body = (await request.json()) as
      | { metadata?: Record<string, string>; requireSignedURLs?: boolean; source?: string }
      | null;
    if (body?.metadata && typeof body.metadata === 'object') metadata = body.metadata;
    if (body?.requireSignedURLs === true) requireSignedURLs = true;
    if (typeof body?.source === 'string') source = body.source;
  } catch {
    // No body — that's fine, both options stay default.
  }

  try {
    const result = await createImageDirectUploadUrl({
      // Server-stamped keys go last so a client cannot spoof provenance by
      // sending its own `uploadedBy`. This is what later lets media-delete
      // prove the caller owns an image that has no DB row of its own.
      metadata: {
        ...metadata,
        [CF_META_UPLOADED_BY]: userId,
        ...(source ? { [CF_META_SOURCE]: source } : {}),
      },
      expiryMinutes: 30,
      requireSignedURLs,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create upload URL';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
