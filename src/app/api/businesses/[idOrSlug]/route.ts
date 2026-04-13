import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Business not found' }, { status: 404 });
}
