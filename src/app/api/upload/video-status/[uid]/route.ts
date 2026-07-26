import { NextResponse, type NextRequest } from 'next/server';
import { getVerifiedUserId } from '@/utils/supabase/server';
import { getStreamVideo, isStreamUid } from '@/lib/cloudflare/stream';

/**
 * Poll the transcode state of a video the caller just uploaded.
 *
 * Scoped to the caller's own uploads on purpose. `/api/upload/video-url` stamps
 * `meta.uploadedBy` from the verified session, and this is the only consumer
 * (upload.service.ts polls it after a direct-creator upload), so there is no
 * legitimate reason to answer for somebody else's uid. Without the check the
 * route enumerates every Stream asset in the account — state, duration,
 * dimensions and poster URL — and Stream uids are public, they appear in the
 * `videodelivery.net/<uid>/…` and `iframe.videodelivery.net/<uid>` URLs of
 * every rendered post.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const userId = await getVerifiedUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { uid } = await params;
  if (!uid) return NextResponse.json({ error: 'uid is required' }, { status: 400 });
  if (!isStreamUid(uid)) return NextResponse.json({ error: 'Invalid uid' }, { status: 400 });

  try {
    const video = await getStreamVideo(uid);
    if (video.meta?.uploadedBy !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
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
  } catch {
    // Deliberately opaque: the upstream Cloudflare error text was previously
    // returned verbatim, which turns this route into an oracle for which API
    // paths the production token can reach.
    return NextResponse.json({ error: 'Failed to fetch video status' }, { status: 500 });
  }
}
