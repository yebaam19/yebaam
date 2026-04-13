import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ profile: null, services: [] });
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
