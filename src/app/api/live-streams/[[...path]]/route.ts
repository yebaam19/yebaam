import { NextResponse, type NextRequest } from 'next/server';

function payloadFor(path: string[]): unknown {
  const joined = path.join('/');
  if (joined === '' || joined === 'active' || joined === 'recorded') {
    return { streams: [], total: 0 };
  }
  if (joined === 'channel') {
    return { channel: null };
  }
  if (joined === 'status') {
    return { isLive: false };
  }
  if (joined.endsWith('/comments')) {
    return { comments: [], total: 0 };
  }
  return null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await context.params;
  const payload = payloadFor(path);
  if (payload === null) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(payload);
}

export async function POST() {
  return NextResponse.json(
    { error: 'Live-stream backend is not yet migrated to Supabase.' },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Live-stream backend is not yet migrated to Supabase.' },
    { status: 501 }
  );
}
