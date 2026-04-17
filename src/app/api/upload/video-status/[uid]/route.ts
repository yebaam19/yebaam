import { NextResponse, type NextRequest } from 'next/server';
import { getServerAccessToken } from '@/utils/supabase/server';
import { getStreamVideo } from '@/lib/cloudflare/stream';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { uid } = await params;
  if (!uid) return NextResponse.json({ error: 'uid is required' }, { status: 400 });

  try {
    const video = await getStreamVideo(uid);
    return NextResponse.json({
      success: true,
      data: {
        uid: video.uid,
        state: video.status.state,
        readyToStream: video.readyToStream,
        duration: video.duration,
        width: video.input?.width ?? null,
        height: video.input?.height ?? null,
        thumbnail: video.thumbnail,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch video status';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
