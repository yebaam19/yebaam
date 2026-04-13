import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/lib/insforge/server';
import {
  mapBusinessBasic,
  slugify,
  type BusinessRow,
  type BusinessCategoryRow,
  type BusinessCityRow,
  type ProfileLite,
  type StateRow,
} from '@/lib/api/businesses';

async function loadRefs(
  client: Awaited<ReturnType<typeof getServerClient>>,
  rows: BusinessRow[]
) {
  const categoryIds = Array.from(
    new Set(rows.map((r) => r.category_id).filter(Boolean) as string[])
  );
  const cityIds = Array.from(new Set(rows.map((r) => r.city_id).filter(Boolean) as string[]));
  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id)));
  const businessIds = rows.map((r) => r.id);

  const [categoriesRes, citiesRes, ownersRes] = await Promise.all([
    categoryIds.length
      ? client.database.from('business_categories').select('*').in('id', categoryIds)
      : Promise.resolve({ data: [] as BusinessCategoryRow[] }),
    cityIds.length
      ? client.database.from('business_cities').select('*').in('id', cityIds)
      : Promise.resolve({ data: [] as BusinessCityRow[] }),
    ownerIds.length
      ? client.database
          .from('profiles')
          .select('id,username,first_name,last_name,avatar_url')
          .in('id', ownerIds)
      : Promise.resolve({ data: [] as ProfileLite[] }),
  ]);

  const cities = new Map<string, BusinessCityRow>();
  for (const c of ((citiesRes.data ?? []) as BusinessCityRow[])) cities.set(c.id, c);

  const stateIds = Array.from(new Set(Array.from(cities.values()).map((c) => c.state_id)));
  const { data: statesData } = stateIds.length
    ? await client.database.from('states').select('*').in('id', stateIds)
    : { data: [] as StateRow[] };

  const categories = new Map<string, BusinessCategoryRow>();
  for (const c of ((categoriesRes.data ?? []) as BusinessCategoryRow[])) categories.set(c.id, c);

  const states = new Map<string, StateRow>();
  for (const s of ((statesData ?? []) as StateRow[])) states.set(s.id, s);

  const owners = new Map<string, ProfileLite>();
  for (const o of ((ownersRes.data ?? []) as ProfileLite[])) owners.set(o.id, o);

  const mediaCount = new Map<string, number>();
  const reviewsCount = new Map<string, number>();
  if (businessIds.length) {
    const { data: mediaRows } = await client.database
      .from('business_media')
      .select('business_id')
      .in('business_id', businessIds);
    for (const m of ((mediaRows ?? []) as { business_id: string }[])) {
      mediaCount.set(m.business_id, (mediaCount.get(m.business_id) ?? 0) + 1);
    }
    const { data: reviewRows } = await client.database
      .from('business_reviews')
      .select('business_id')
      .in('business_id', businessIds);
    for (const r of ((reviewRows ?? []) as { business_id: string }[])) {
      reviewsCount.set(r.business_id, (reviewsCount.get(r.business_id) ?? 0) + 1);
    }
  }

  return { categories, cities, states, owners, mediaCount, reviewsCount };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get('page') ?? '1') || 1, 1);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '20') || 20, 1), 100);
  const search = searchParams.get('search')?.trim() ?? '';
  const categoryId = searchParams.get('categoryId')?.trim() ?? '';
  const cityId = searchParams.get('cityId')?.trim() ?? '';
  const stateId = searchParams.get('stateId')?.trim() ?? '';
  const minRating = Number(searchParams.get('minRating') ?? '0') || 0;
  const offset = (page - 1) * limit;

  const client = await getServerClient();

  let cityIdsForState: string[] | null = null;
  if (stateId && !cityId) {
    const { data: cityRows } = await client.database
      .from('business_cities')
      .select('id')
      .eq('state_id', stateId);
    cityIdsForState = ((cityRows ?? []) as { id: string }[]).map((c) => c.id);
    if (cityIdsForState.length === 0) {
      return NextResponse.json({
        businesses: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      });
    }
  }

  let query = client.database
    .from('businesses')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) query = query.ilike('name', `%${search}%`);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (cityId) query = query.eq('city_id', cityId);
  if (cityIdsForState) query = query.in('city_id', cityIdsForState);
  if (minRating > 0) query = query.gte('average_rating', minRating);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as BusinessRow[];
  const refs = await loadRefs(client, rows);
  const businesses = rows.map((r) => mapBusinessBasic(r, refs));

  const total = count ?? businesses.length;
  return NextResponse.json({
    businesses,
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const baseSlug = slugify(name);
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: conflict } = await client.database
      .from('businesses')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!conflict) break;
    slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
  }

  const insertRow = {
    owner_id: userId,
    name,
    slug,
    description: typeof body.description === 'string' ? body.description : null,
    category_id: typeof body.categoryId === 'string' ? body.categoryId : null,
    city_id: typeof body.cityId === 'string' ? body.cityId : null,
    address: typeof body.address === 'string' ? body.address : null,
    email: typeof body.email === 'string' ? body.email : null,
    phone: typeof body.phone === 'string' ? body.phone : null,
    website: typeof body.website === 'string' ? body.website : null,
    facebook_url: typeof body.facebookUrl === 'string' ? body.facebookUrl : null,
    instagram_url: typeof body.instagramUrl === 'string' ? body.instagramUrl : null,
    twitter_url: typeof body.twitterUrl === 'string' ? body.twitterUrl : null,
    linkedin_url: typeof body.linkedinUrl === 'string' ? body.linkedinUrl : null,
    tiktok_url: typeof body.tiktokUrl === 'string' ? body.tiktokUrl : null,
    youtube_url: typeof body.youtubeUrl === 'string' ? body.youtubeUrl : null,
    logo_url: typeof body.logoUrl === 'string' ? body.logoUrl : null,
    cover_url: typeof body.coverUrl === 'string' ? body.coverUrl : null,
    ad_image_url: typeof body.adImageUrl === 'string' ? body.adImageUrl : null,
    visibility: typeof body.visibility === 'string' ? body.visibility : 'PUBLIC',
    status: 'ACTIVE',
    tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
  };

  const { data, error } = await client.database
    .from('businesses')
    .insert(insertRow)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create business' },
      { status: 500 }
    );
  }

  const row = data as BusinessRow;
  const refs = await loadRefs(client, [row]);
  return NextResponse.json(mapBusinessBasic(row, refs));
}
