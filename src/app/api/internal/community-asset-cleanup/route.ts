import { NextResponse, type NextRequest } from 'next/server';
import { processAssetCleanup } from '@/features/communities/server/asset-cleanup.server';
import { checkInternalBearer } from '@/lib/internal-bearer';

export const runtime = 'nodejs';
export const maxDuration = 60;
const headers = { 'Cache-Control': 'private, no-store' };

export async function POST(request: NextRequest) {
  const authorization = checkInternalBearer(request.headers.get('authorization'), process.env.COMMUNITY_CLEANUP_SECRET);
  if (authorization === 'unconfigured') return NextResponse.json({ error: 'Cleanup is not configured.' }, { status: 503, headers });
  if (authorization !== 'authorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }
  try {
    const result = await processAssetCleanup();
    return NextResponse.json(result, { headers });
  } catch {
    return NextResponse.json({ error: 'Cleanup deferred. Retry the request.' }, { status: 503, headers });
  }
}
