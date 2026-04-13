import { NextResponse, type NextRequest } from 'next/server';

function emptyForPath(path: string[]): unknown {
  const joined = path.join('/');
  if (joined === 'my-groups' || joined === 'suggested' || joined === 'search') {
    return { groups: [], total: 0 };
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
    { error: 'Groups backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Groups backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Groups backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}
