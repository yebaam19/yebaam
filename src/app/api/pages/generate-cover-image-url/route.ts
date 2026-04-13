import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Presigned URL uploads are no longer supported. Post the file to /api/upload with bucket=covers.',
    },
    { status: 501 }
  );
}
