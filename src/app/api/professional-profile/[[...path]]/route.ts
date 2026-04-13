import { NextResponse, type NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await context.params;
  const joined = path.join('/');

  // List endpoint — return empty list shape.
  if (joined === '' || joined === 'list') {
    return NextResponse.json({ profiles: [], total: 0 });
  }

  // Every single-profile lookup must 404 until the real schema lands, so
  // callers treat "no profile yet" correctly (the service maps 404 → null).
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json(
    { error: 'Professional profile backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Professional profile backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Professional profile backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Professional profile backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}
