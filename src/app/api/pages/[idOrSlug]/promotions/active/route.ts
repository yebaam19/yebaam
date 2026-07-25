import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([], {
    headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
  });
}
