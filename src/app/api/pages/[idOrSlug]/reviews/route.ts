import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import {
  mapReview,
  resolvePageId,
  type ProfileLite,
  type ReviewRow,
} from '@/lib/api/page-reviews';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get('page') ?? '1') || 1, 1);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '10') || 10, 1), 50);
  const sortBy = searchParams.get('sortBy') ?? 'recent';
  const filterBy = searchParams.get('filterBy') ?? 'all';
  const offset = (page - 1) * limit;

  const client = await getServerClient();
  const pageId = await resolvePageId(client, idOrSlug);
  if (!pageId) return NextResponse.json({ reviews: [], total: 0, hasMore: false });

  let query = client
    .from('page_reviews')
    .select('*', { count: 'exact' })
    .eq('page_id', pageId)
    .range(offset, offset + limit - 1);

  if (filterBy && filterBy !== 'all') {
    const ratingFilter = Number(filterBy);
    if (Number.isFinite(ratingFilter)) query = query.eq('rating', ratingFilter);
  }

  if (sortBy === 'helpful') query = query.order('helpful_count', { ascending: false });
  else if (sortBy === 'rating-high') query = query.order('rating', { ascending: false });
  else if (sortBy === 'rating-low') query = query.order('rating', { ascending: true });
  else query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as ReviewRow[];
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));

  const { data: profiles } = userIds.length
    ? await client
        .from('profiles')
        .select('id,username,first_name,last_name,avatar_url')
        .in('id', userIds)
    : { data: [] as ProfileLite[] };

  const profileMap = new Map<string, ProfileLite>();
  for (const p of (profiles ?? []) as ProfileLite[]) profileMap.set(p.id, p);

  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id ?? null;
  const myHelpful = new Set<string>();
  if (viewerId && rows.length > 0) {
    const { data: helps } = await client
      .from('page_review_helpful')
      .select('review_id')
      .eq('user_id', viewerId)
      .in(
        'review_id',
        rows.map((r) => r.id)
      );
    for (const h of (helps ?? []) as Array<{ review_id: string }>) myHelpful.add(h.review_id);
  }

  const total = count ?? rows.length;
  return NextResponse.json({
    reviews: rows.map((r) => mapReview(r, profileMap.get(r.user_id), myHelpful.has(r.id))),
    total,
    hasMore: offset + rows.length < total,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    rating?: number;
    comment?: string;
    photos?: Array<{ url: string; s3Key?: string }>;
  };
  const rating = Number(body.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating must be 1-5' }, { status: 400 });
  }

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pageId = await resolvePageId(client, idOrSlug);
  if (!pageId) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const { data, error } = await client
    .from('page_reviews')
    .insert({
      page_id: pageId,
      user_id: userId,
      rating,
      comment: body.comment ?? '',
      photos: body.photos ?? [],
    })
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create review' },
      { status: 500 }
    );
  }

  const { data: profile } = await client
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url')
    .eq('id', userId)
    .maybeSingle();

  return NextResponse.json(
    mapReview(data as ReviewRow, (profile ?? undefined) as ProfileLite | undefined, false)
  );
}
