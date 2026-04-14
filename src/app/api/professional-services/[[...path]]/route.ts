import { NextResponse, type NextRequest } from 'next/server';

function payloadFor(path: string[]): unknown {
  const joined = path.join('/');
  if (joined === 'categories' || joined === 'locations' || joined === '' || joined === 'list') {
    return [];
  }
  if (joined === 'stats') {
    return { totalServices: 0, totalBookings: 0, totalReviews: 0 };
  }
  return [];
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await context.params;
  return NextResponse.json(payloadFor(path));
}

export async function POST() {
  return NextResponse.json(
    { error: 'Professional services backend is not yet migrated to Supabase.' },
    { status: 501 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Professional services backend is not yet migrated to Supabase.' },
    { status: 501 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Professional services backend is not yet migrated to Supabase.' },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Professional services backend is not yet migrated to Supabase.' },
    { status: 501 }
  );
}
