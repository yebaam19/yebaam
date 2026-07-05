import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import {
  loadMyReactions,
  loadProfilesForPosts,
  mapPost,
  sanitizeMediaFilesForInsert,
  type PostRow,
} from '@/lib/api/posts';
import { mirrorMediaToProfileGallery } from '@/lib/api/mirror-post-media';

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
  const blogIdFilter = searchParams.get('blogId');
  const businessIdFilter = searchParams.get('businessId');
  const limit = parseIntParam(searchParams.get('limit'), 20);
  const page = parseIntParam(searchParams.get('page'), 1);
  const offset = (page - 1) * limit;

  const { client, userId } = await getUserId();

  const needsAuth = scope === 'mine' || scope === 'timeline' || scope === 'suggestions';
  // business scope is public — followers and visitors can read a business wall without auth

  if (needsAuth && !userId) {
    return NextResponse.json({ success: true, data: [] });
  }

  // ── Timeline: single-source-of-truth RPC (friends + followed businesses) ──
  if (scope === 'timeline' && userId) {
    const { data: rpcRows, error: rpcError } = await client.rpc('get_timeline_posts', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset,
    });
    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }
    const rows = (rpcRows ?? []) as PostRow[];
    const profiles = await loadProfilesForPosts(client, rows);
    const myReactions = await loadMyReactions(client, rows.map((r) => r.id), userId);
    const posts = rows.map((r) => mapPost(r, profiles, myReactions.get(r.id) ?? null));
    return NextResponse.json({ success: true, data: posts });
  }

  let query = client
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (scope === 'blog') {
    // Public blog wall: posts tagged with this blog_id. No auth required; the
    // posts are public so SELECT RLS lets anonymous visitors read them.
    if (!blogIdFilter) {
      return NextResponse.json({ success: true, data: [] });
    }
    query = query.eq('blog_id', blogIdFilter);
  } else if (scope === 'business') {
    // Public business wall: posts tagged with this business_id.
    if (!businessIdFilter) {
      return NextResponse.json({ success: true, data: [] });
    }
    query = query.eq('business_id', businessIdFilter);
  } else {
    // Every non-blog, non-business scope excludes wall posts so they never leak
    // into the global feed, the personal timeline, or profile posts.
    query = query.is('blog_id', null).is('business_id', null);

    if (scope === 'mine' && userId) {
      query = query.eq('author_id', userId);
    } else if (scope === 'user' && userIdFilter) {
      query = query.eq('author_id', userIdFilter);
    } else if ((scope === 'timeline' || scope === 'suggestions') && userId) {
      const { data: friendships } = await client
        .from('friendships')
        .select('requester_id, recipient_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

      const friendIds = new Set<string>([userId]);
      for (const f of (friendships ?? []) as Array<{ requester_id: string; recipient_id: string }>) {
        friendIds.add(f.requester_id === userId ? f.recipient_id : f.requester_id);
      }

      if (scope === 'timeline') {
        // Friends-only feed: own posts (any privacy) + accepted-friend posts
        // whose privacy is 'public' or 'friends'. Private friend posts hidden.
        query = query
          .in('author_id', Array.from(friendIds))
          .or(`author_id.eq.${userId},privacy.in.(public,friends)`);
      } else {
        // Suggestions: public posts from users outside the user's social graph
        // (friends + clubmates). Clubmates are excluded so they appear in
        // "personas que quizás conozcas" only when not already connected.
        const connectedIds = new Set<string>(friendIds);
        const { data: myMemberships } = await client
          .from('club_members')
          .select('club_id')
          .eq('user_id', userId);
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
        query = query
          .eq('privacy', 'public')
          .not('author_id', 'in', `(${Array.from(connectedIds).join(',')})`);
      }
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

  // Blog-wall post: tag with blog_id and force `public`.
  const blogId = typeof body.blogId === 'string' && body.blogId ? body.blogId : null;

  // Business-wall post: tag with business_id and force `public`.
  // Verify the caller is an admin or creator of the business before inserting.
  // `comidas` is not an exposed PostgREST schema, so this goes through the
  // same SECURITY DEFINER RPC business.server.ts uses for admin checks.
  const businessId = typeof body.businessId === 'string' && body.businessId ? body.businessId : null;
  if (businessId) {
    const { data: isAdmin, error: adminCheckError } = await client.rpc('check_business_admin', {
      p_business_id: businessId,
    });
    if (adminCheckError || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const effectivePrivacy = (blogId || businessId) ? 'public' : privacy;

  const insertRow = {
    author_id: userId,
    blog_id: blogId,
    business_id: businessId,
    content: typeof body.content === 'string' ? body.content : '',
    background_color: typeof body.backgroundColor === 'string' ? body.backgroundColor : null,
    // id-first: persist only the bare Cloudflare id + metadata per entry —
    // never full delivery URLs. Render-time URL building lives in normalizeMedia.
    media_files: sanitizeMediaFilesForInsert(body.mediaFiles),
    privacy: effectivePrivacy,
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

  // Mirror media into the profile gallery tables. Wall posts (blog or business)
  // are skipped — their media belongs to the wall, not the author's profile gallery.
  if (!blogId && !businessId) {
    await mirrorMediaToProfileGallery(client, userId, effectivePrivacy, insertRow.media_files);
  }

  const profiles = await loadProfilesForPosts(client, [row]);
  return NextResponse.json({ success: true, data: mapPost(row, profiles) });
}
