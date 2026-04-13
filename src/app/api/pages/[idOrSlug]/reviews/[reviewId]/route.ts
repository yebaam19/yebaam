import { NextResponse } from 'next/server';

export async function PUT() {
  return NextResponse.json(
    { error: 'Page reviews backend is not yet migrated.' },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Page reviews backend is not yet migrated.' },
    { status: 501 }
  );
}
