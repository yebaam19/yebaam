import { NextResponse, type NextRequest } from 'next/server';

function emptyForPath(path: string[]): unknown {
  const joined = path.join('/');
  if (joined === 'search') {
    return { clubs: [], total: 0, page: 1, limit: 20, hasMore: false };
  }
  if (joined.endsWith('/members')) {
    return { members: [], total: 0, page: 1, limit: 20, hasMore: false };
  }
  if (
    joined === 'my-clubs' ||
    joined.startsWith('discovery/') ||
    joined === ''
  ) {
    return [];
  }
  if (joined.startsWith('slug/')) {
    return null;
  }
  return null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await context.params;
  const payload = emptyForPath(path);
  if (payload === null) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(payload);
}

export async function POST() {
  return NextResponse.json(
    { error: 'Clubs backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Clubs backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Clubs backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}
