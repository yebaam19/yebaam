import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import {
  mapBusinessDetail,
  type BusinessRow,
  type BusinessCategoryRow,
  type BusinessCityRow,
  type BusinessMediaRow,
  type BusinessReviewRow,
  type ProfileLite,
  type StateRow,
} from '@/lib/api/businesses';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadBusiness(
  client: Awaited<ReturnType<typeof getServerClient>>,
  idOrSlug: string
) {
  const { data } = UUID_RE.test(idOrSlug)
    ? await client.from('businesses').select('*').eq('id', idOrSlug).maybeSingle()
    : await client.from('businesses').select('*').eq('slug', idOrSlug).maybeSingle();
  return (data ?? null) as BusinessRow | null;
}

async function detailResponse(
  client: Awaited<ReturnType<typeof getServerClient>>,
  row: BusinessRow
) {
  const [categoryRes, cityRes, ownerRes, mediaRes, reviewsRes] = await Promise.all([
    row.category_id
      ? client.from('business_categories').select('*').eq('id', row.category_id).maybeSingle()
      : Promise.resolve({ data: null as BusinessCategoryRow | null }),
    row.city_id
      ? client.from('business_cities').select('*').eq('id', row.city_id).maybeSingle()
      : Promise.resolve({ data: null as BusinessCityRow | null }),
    client
      .from('profiles')
      .select('id,username,first_name,last_name,avatar_url')
      .eq('id', row.owner_id)
      .maybeSingle(),
    client
      .from('business_media')
      .select('*')
      .eq('business_id', row.id)
      .order('sort_order', { ascending: true }),
    client
      .from('business_reviews')
      .select('*')
      .eq('business_id', row.id)
      .order('created_at', { ascending: false }),
  ]);

  const category = (categoryRes.data ?? null) as BusinessCategoryRow | null;
  const city = (cityRes.data ?? null) as BusinessCityRow | null;
  const owner = (ownerRes.data ?? null) as ProfileLite | null;
  const media = (mediaRes.data ?? []) as BusinessMediaRow[];
  const reviews = (reviewsRes.data ?? []) as BusinessReviewRow[];

  let state: StateRow | null = null;
  if (city) {
    const { data: stateData } = await client
      .from('states')
      .select('*')
      .eq('id', city.state_id)
      .maybeSingle();
    state = (stateData ?? null) as StateRow | null;
  }

  const reviewerIds = Array.from(new Set(reviews.map((r) => r.user_id)));
  const { data: reviewers } = reviewerIds.length
    ? await client
        .from('profiles')
        .select('id,username,first_name,last_name,avatar_url')
        .in('id', reviewerIds)
    : { data: [] as ProfileLite[] };

  const reviewerMap = new Map<string, ProfileLite>();
  for (const p of (reviewers ?? []) as ProfileLite[]) reviewerMap.set(p.id, p);

  const reviewsWithAuthor = reviews.map((r) => ({ ...r, author: reviewerMap.get(r.user_id) }));

  const refs = {
    categories: new Map(category ? [[category.id, category]] : []),
    cities: new Map(city ? [[city.id, city]] : []),
    states: new Map(state ? [[state.id, state]] : []),
    owners: new Map(owner ? [[owner.id, owner]] : []),
    mediaCount: new Map([[row.id, media.length]]),
    reviewsCount: new Map([[row.id, reviews.length]]),
  };

  return mapBusinessDetail(row, refs, media, reviewsWithAuthor);
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const row = await loadBusiness(client, idOrSlug);
  if (!row) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  const business = await detailResponse(client, row);
  // NOTE: deliberately NOT CDN-cacheable. `businesses` RLS is
  // `visibility = 'PUBLIC' OR owner_id = auth.uid()`, and the payload joins
  // `profiles` (RLS: public OR self OR friends), so this response varies per
  // viewer. A shared `public, s-maxage` cache would serve an owner's private
  // business — and friends-only names — to anonymous callers.
  return NextResponse.json({ business });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const client = await getServerClient();
  const row = await loadBusiness(client, idOrSlug);
  if (!row) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === 'string') patch.name = body.name;
  if (typeof body.description === 'string' || body.description === null) patch.description = body.description;
  if (typeof body.categoryId === 'string' || body.categoryId === null) patch.category_id = body.categoryId;
  if (typeof body.cityId === 'string' || body.cityId === null) patch.city_id = body.cityId;
  if (typeof body.address === 'string' || body.address === null) patch.address = body.address;
  if (typeof body.email === 'string' || body.email === null) patch.email = body.email;
  if (typeof body.phone === 'string' || body.phone === null) patch.phone = body.phone;
  if (typeof body.website === 'string' || body.website === null) patch.website = body.website;
  if (typeof body.logoUrl === 'string' || body.logoUrl === null) patch.logo_url = body.logoUrl;
  if (typeof body.coverUrl === 'string' || body.coverUrl === null) patch.cover_url = body.coverUrl;
  if (typeof body.adImageUrl === 'string' || body.adImageUrl === null) patch.ad_image_url = body.adImageUrl;
  if (typeof body.facebookUrl === 'string' || body.facebookUrl === null) patch.facebook_url = body.facebookUrl;
  if (typeof body.instagramUrl === 'string' || body.instagramUrl === null) patch.instagram_url = body.instagramUrl;
  if (typeof body.twitterUrl === 'string' || body.twitterUrl === null) patch.twitter_url = body.twitterUrl;
  if (typeof body.linkedinUrl === 'string' || body.linkedinUrl === null) patch.linkedin_url = body.linkedinUrl;
  if (typeof body.tiktokUrl === 'string' || body.tiktokUrl === null) patch.tiktok_url = body.tiktokUrl;
  if (typeof body.youtubeUrl === 'string' || body.youtubeUrl === null) patch.youtube_url = body.youtubeUrl;
  if (body.hours && typeof body.hours === 'object') patch.hours = body.hours;
  if (Array.isArray(body.tags)) patch.tags = body.tags;
  if (typeof body.visibility === 'string') patch.visibility = body.visibility;

  const { data, error } = await client
    .from('businesses')
    .update(patch)
    .eq('id', row.id)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update business' },
      { status: 500 }
    );
  }

  const updated = data as BusinessRow;
  const business = await detailResponse(client, updated);
  return NextResponse.json({ business });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const row = await loadBusiness(client, idOrSlug);
  if (!row) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { error } = await client.from('businesses').delete().eq('id', row.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
