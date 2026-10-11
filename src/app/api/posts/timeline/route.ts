import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerClient } from '@/utils/supabase/server';
import { loadTimelinePage } from '@/lib/api/timeline-page';

const cursorSchema = z.object({ createdAt: z.string().datetime({ offset: true }), id: z.string().uuid() });
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: NextRequest) {
  const client = await getServerClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  const params = request.nextUrl.searchParams;
  const hasCursor = params.has('before') || params.has('beforeId');
  const parsed = hasCursor ? cursorSchema.safeParse({ createdAt: params.get('before'), id: params.get('beforeId') }) : null;
  if (parsed && !parsed.success) return NextResponse.json({ error: 'Invalid cursor' }, { status: 400, headers });
  try {
    const page = await loadTimelinePage(client, data.user.id, parsed?.success ? parsed.data : null);
    return NextResponse.json(page, { headers });
  } catch {
    return NextResponse.json({ error: 'Unable to load timeline' }, { status: 500, headers });
  }
}
