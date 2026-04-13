import { NextResponse, type NextRequest } from 'next/server';

function payloadFor(path: string[]): unknown {
  const joined = path.join('/');
  if (joined === '' || joined === 'list') {
    return { pages: [], total: 0, page: 1, limit: 20, hasMore: false };
  }
  if (joined.endsWith('/posts')) {
    return { data: [], total: 0 };
  }
  if (joined.endsWith('/reviews')) {
    return { reviews: [], total: 0 };
  }
  if (joined.endsWith('/photos')) {
    return { photos: [], total: 0 };
  }
  if (joined.endsWith('/community')) {
    return { members: [], total: 0 };
  }
  if (joined.endsWith('/promotions')) {
    return { promotions: [], total: 0 };
  }
  if (joined.endsWith('/messages')) {
    return { messages: [], total: 0 };
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
    { error: 'Pages backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Pages backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Pages backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Pages backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}
