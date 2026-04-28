import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import {
  loadMyReactions,
  loadProfilesForPosts,
  mapPost,
  type PostRow,
} from '@/lib/api/posts';

async function getUserId() {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  return { client, userId: data?.user?.id ?? null };
}

function parseIntParam(value: string | null, fallback: number, max = 100): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') ?? 'timeline';
  const userIdFilter = searchParams.get('userId');
  const limit = parseIntParam(searchParams.get('limit'), 20);
  const page = parseIntParam(searchParams.get('page'), 1);
  const offset = (page - 1) * limit;

  const { client, userId } = await getUserId();

  const needsAuth = scope === 'mine' || scope === 'timeline' || scope === 'suggestions';

  if (needsAuth && !userId) {
    return NextResponse.json({ success: true, data: [] });
  }

  let query = client
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (scope === 'mine' && userId) {
    query = query.eq('author_id', userId);
  } else if (scope === 'user' && userIdFilter) {
    query = query.eq('author_id', userIdFilter);
  } else if ((scope === 'timeline' || scope === 'suggestions') && userId) {
    // Facebook-style feed: own posts + accepted friends' posts + fellow
    // club-members' posts. Suggestions scope returns public posts from
    // users NOT in that set (for the "personas que quizás conozcas" block).
    const [{ data: friendships }, { data: myMemberships }] = await Promise.all([
      client
        .from('friendships')
        .select('requester_id, recipient_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`),
      client.from('club_members').select('club_id').eq('user_id', userId),
    ]);

    const connectedIds = new Set<string>([userId]);
    for (const f of (friendships ?? []) as Array<{ requester_id: string; recipient_id: string }>) {
      connectedIds.add(f.requester_id === userId ? f.recipient_id : f.requester_id);
    }

    const myClubIds = ((myMemberships ?? []) as Array<{ club_id: string }>).map((m) => m.club_id);
    if (myClubIds.length > 0) {
      const { data: clubmates } = await client
        .from('club_members')
        .select('user_id')
        .in('club_id', myClubIds);
      for (const row of (clubmates ?? []) as Array<{ user_id: string }>) {
        connectedIds.add(row.user_id);
      }
    }

    if (scope === 'timeline') {
      query = query.in('author_id', Array.from(connectedIds));
    } else {
      // suggestions: public posts from unrelated users.
      query = query
        .eq('privacy', 'public')
        .not('author_id', 'in', `(${Array.from(connectedIds).join(',')})`);
    }
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as PostRow[];
  const profiles = await loadProfilesForPosts(client, rows);
  const myReactions = await loadMyReactions(
    client,
    rows.map((r) => r.id),
    userId
  );
  const posts = rows.map((r) => mapPost(r, profiles, myReactions.get(r.id) ?? null));

  return NextResponse.json({ success: true, data: posts });
}

export async function POST(request: NextRequest) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { client, userId } = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const privacyRaw = typeof body.privacy === 'string' ? (body.privacy as string).toLowerCase() : 'public';
  const privacy = ['public', 'friends', 'private'].includes(privacyRaw) ? privacyRaw : 'public';

  const insertRow = {
    author_id: userId,
    content: typeof body.content === 'string' ? body.content : '',
    background_color: typeof body.backgroundColor === 'string' ? body.backgroundColor : null,
    media_files: Array.isArray(body.mediaFiles) ? body.mediaFiles : [],
    privacy,
    is_reel: Boolean(body.isReel),
    aspect_ratio: typeof body.aspectRatio === 'string' ? body.aspectRatio : null,
    reactions_count: { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
    comments_count: 0,
  };

  const { data, error } = await client
    .from('posts')
    .insert(insertRow)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create post' },
      { status: 500 }
    );
  }

  const row = data as PostRow;

  // Mirror media into the profile gallery tables so photos/videos posted to
  // the feed also show up under the user's profile Fotos/Videos tabs. Failure
  // here must not block the post response — log and continue.
  await mirrorMediaToProfileGallery(client, userId, privacy, insertRow.media_files);

  const profiles = await loadProfilesForPosts(client, [row]);
  return NextResponse.json({ success: true, data: mapPost(row, profiles) });
}

type PostMediaFile = {
  s3Key?: string;
  url?: string;
  type?: 'image' | 'video' | string;
  size?: number;
  mimeType?: string;
  duration?: number;
  streamUid?: string;
  thumbnailUrl?: string;
};

type SupabaseClient = Awaited<ReturnType<typeof getServerClient>>;

const POST_TO_GALLERY_VISIBILITY: Record<string, 'public' | 'friends' | 'private'> = {
  public: 'public',
  friends: 'friends',
  private: 'private',
};

async function mirrorMediaToProfileGallery(
  client: SupabaseClient,
  userId: string,
  postPrivacy: string,
  mediaFiles: unknown,
): Promise<void> {
  if (!Array.isArray(mediaFiles) || mediaFiles.length === 0) return;
  const visibility = POST_TO_GALLERY_VISIBILITY[postPrivacy] ?? 'public';

  const photos: Array<Record<string, unknown>> = [];
  const videos: Array<Record<string, unknown>> = [];

  for (const raw of mediaFiles as PostMediaFile[]) {
    if (!raw || typeof raw !== 'object') continue;
    const key = raw.streamUid ?? raw.s3Key;
    if (!key || !raw.url) continue;

    if (raw.type === 'video') {
      videos.push({
        user_id: userId,
        storage_bucket: 'cloudflare-stream',
        storage_key: key,
        url: raw.url,
        thumbnail_url: raw.thumbnailUrl ?? null,
        duration_seconds: typeof raw.duration === 'number' ? Math.round(raw.duration) : null,
        size_bytes: typeof raw.size === 'number' ? raw.size : null,
        mime_type: typeof raw.mimeType === 'string' ? raw.mimeType : null,
        visibility,
      });
    } else if (raw.type === 'image') {
      photos.push({
        user_id: userId,
        storage_bucket: 'cloudflare-images',
        storage_key: key,
        url: raw.url,
        size_bytes: typeof raw.size === 'number' ? raw.size : null,
        mime_type: typeof raw.mimeType === 'string' ? raw.mimeType : null,
        visibility,
      });
    }
  }

  if (photos.length > 0) {
    const { error: photoErr } = await client.from('profile_photos').insert(photos);
    if (photoErr) console.error('[posts] mirror profile_photos failed:', photoErr.message);
  }
  if (videos.length > 0) {
    const { error: videoErr } = await client.from('profile_videos').insert(videos);
    if (videoErr) console.error('[posts] mirror profile_videos failed:', videoErr.message);
  }
}
