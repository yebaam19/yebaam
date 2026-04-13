import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    businesses: [],
    total: 0,
    page: 1,
    limit: 20,
    hasMore: false,
  });
}
