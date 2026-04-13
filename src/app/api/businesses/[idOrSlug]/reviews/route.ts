import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/lib/insforge/server';
import type { BusinessReviewRow, ProfileLite } from '@/lib/api/businesses';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveBusinessId(
  client: Awaited<ReturnType<typeof getServerClient>>,
  idOrSlug: string
): Promise<string | null> {
  if (UUID_RE.test(idOrSlug)) return idOrSlug;
  const { data } = await client.database
    .from('businesses')
    .select('id')
    .eq('slug', idOrSlug)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

async function refreshAverage(
  client: Awaited<ReturnType<typeof getServerClient>>,
  businessId: string
) {
  const { data } = await client.database
    .from('business_reviews')
    .select('rating')
    .eq('business_id', businessId);
  const ratings = ((data ?? []) as { rating: number }[]).map((r) => r.rating);
  const avg = ratings.length
    ? ratings.reduce((sum, n) => sum + n, 0) / ratings.length
    : null;
  await client.database
    .from('businesses')
    .update({ average_rating: avg, updated_at: new Date().toISOString() })
    .eq('id', businessId);
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const businessId = await resolveBusinessId(client, idOrSlug);
  if (!businessId) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { data, error } = await client.database
    .from('business_reviews')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as BusinessReviewRow[];
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles } = userIds.length
    ? await client.database
        .from('profiles')
        .select('id,username,first_name,last_name,avatar_url')
        .in('id', userIds)
    : { data: [] as ProfileLite[] };

  const profileMap = new Map<string, ProfileLite>();
  for (const p of (profiles ?? []) as ProfileLite[]) profileMap.set(p.id, p);

  return NextResponse.json({
    reviews: rows.map((r) => {
      const author = profileMap.get(r.user_id);
      return {
        id: r.id,
        businessId: r.business_id,
        userId: r.user_id,
        rating: r.rating,
        title: r.title ?? undefined,
        comment: r.comment ?? undefined,
        response: r.response ?? undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        user: {
          id: r.user_id,
          username: author?.username ?? '',
          firstName: author?.first_name ?? '',
          lastName: author?.last_name ?? '',
          avatarUrl: author?.avatar_url ?? undefined,
        },
      };
    }),
    total: rows.length,
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
    title?: string;
    comment?: string;
  };
  const rating = Number(body.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating must be 1-5' }, { status: 400 });
  }

  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const businessId = await resolveBusinessId(client, idOrSlug);
  if (!businessId) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { data: existing } = await client.database
    .from('business_reviews')
    .select('id')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .maybeSingle();

  let saved;
  if (existing) {
    const { data, error } = await client.database
      .from('business_reviews')
      .update({
        rating,
        title: body.title ?? null,
        comment: body.comment ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (existing as { id: string }).id)
      .select('*')
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Failed to update review' },
        { status: 500 }
      );
    }
    saved = data as BusinessReviewRow;
  } else {
    const { data, error } = await client.database
      .from('business_reviews')
      .insert({
        business_id: businessId,
        user_id: userId,
        rating,
        title: body.title ?? null,
        comment: body.comment ?? null,
      })
      .select('*')
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Failed to create review' },
        { status: 500 }
      );
    }
    saved = data as BusinessReviewRow;
  }

  await refreshAverage(client, businessId);

  return NextResponse.json({
    id: saved.id,
    businessId: saved.business_id,
    userId: saved.user_id,
    rating: saved.rating,
    title: saved.title ?? undefined,
    comment: saved.comment ?? undefined,
    response: saved.response ?? undefined,
    createdAt: saved.created_at,
    updatedAt: saved.updated_at,
  });
}
