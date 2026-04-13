import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ messages: [], total: 0 });
}
