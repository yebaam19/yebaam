import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { processAssetCleanup } from '@/features/communities/server/asset-cleanup.server';

export const runtime = 'nodejs';
export const maxDuration = 60;
const headers = { 'Cache-Control': 'private, no-store' };

export async function POST(request: NextRequest) {
  const secret = process.env.COMMUNITY_CLEANUP_SECRET;
  if (!secret || secret.length < 32) return NextResponse.json({ error: 'Cleanup is not configured.' }, { status: 503, headers });
  const provided = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }
  try {
    const result = await processAssetCleanup();
    return NextResponse.json(result, { headers });
  } catch {
    return NextResponse.json({ error: 'Cleanup deferred. Retry the request.' }, { status: 503, headers });
  }
}
