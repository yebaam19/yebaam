import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Page messaging backend is not yet migrated.' },
    { status: 501 }
  );
}
