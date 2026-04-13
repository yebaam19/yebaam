import { NextResponse, type NextRequest } from 'next/server';

function payloadFor(path: string[]): unknown {
  const joined = path.join('/');
  if (joined === '' || joined === 'list') {
    return { cities: [], total: 0 };
  }
  if (joined === 'stats/global') {
    return {
      totalCities: 0,
      totalUsers: 0,
      totalPhotos: 0,
      totalVideos: 0,
      totalMedia: 0,
      totalPosts: 0,
      totalBusinesses: 0,
      totalServices: 0,
      totalDirectoryEntries: 0,
    };
  }
  return null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await context.params;
  const payload = payloadFor(path);
  if (payload === null) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(payload);
}

export async function POST() {
  return NextResponse.json(
    { error: 'Cities backend is not yet migrated to InsForge.' },
    { status: 501 }
  );
}
