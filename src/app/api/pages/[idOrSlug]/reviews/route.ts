import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ reviews: [], total: 0 });
}

export async function POST() {
  return NextResponse.json(
    { error: 'Page reviews backend is not yet migrated.' },
    { status: 501 }
  );
}
