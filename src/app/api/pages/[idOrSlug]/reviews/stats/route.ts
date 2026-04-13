import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    totalReviews: 0,
    averageRating: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
}
