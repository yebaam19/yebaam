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

  const needsAuth = scope === 'mine' || scope === 'timeline';

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
  } else if (scope === 'timeline' && userId) {
    // Facebook-style feed: only own posts + accepted friends' posts.
    const { data: friendships } = await client
      .from('friendships')
      .select('requester_id, recipient_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

    const friendIds = new Set<string>();
    for (const f of (friendships ?? []) as Array<{ requester_id: string; recipient_id: string }>) {
      friendIds.add(f.requester_id === userId ? f.recipient_id : f.requester_id);
    }
    const authorIds = [userId, ...friendIds];
    query = query.in('author_id', authorIds);
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
  const profiles = await loadProfilesForPosts(client, [row]);
  return NextResponse.json({ success: true, data: mapPost(row, profiles) });
}
