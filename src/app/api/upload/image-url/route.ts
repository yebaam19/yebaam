import { NextResponse, type NextRequest } from 'next/server';
import { getServerAccessToken } from '@/utils/supabase/server';
import { createImageDirectUploadUrl } from '@/lib/cloudflare/images';

export async function POST(request: NextRequest) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let metadata: Record<string, string> | undefined;
  try {
    const body = (await request.json()) as { metadata?: Record<string, string> } | null;
    if (body?.metadata && typeof body.metadata === 'object') metadata = body.metadata;
  } catch {
    // No body — that's fine, metadata stays undefined.
  }

  try {
    const result = await createImageDirectUploadUrl({ metadata, expiryMinutes: 30 });
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create upload URL';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
