import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Page reviews backend is not yet migrated.' },
    { status: 501 }
  );
}
