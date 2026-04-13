import { NextResponse } from 'next/server';

export async function DELETE() {
  return NextResponse.json(
    { error: 'Page photos backend is not yet migrated.' },
    { status: 501 }
  );
}
