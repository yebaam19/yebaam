import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ products: [], total: 0 });
}

export async function POST() {
  return NextResponse.json(
    { error: 'Page products backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Page products backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Page products backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}
