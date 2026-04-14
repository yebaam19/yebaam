import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { mapBlog, slugify, type BlogRow, type OwnerProfile } from '@/lib/api/blogs';

async function loadOwners(
  client: Awaited<ReturnType<typeof getServerClient>>,
  rows: BlogRow[]
) {
  const ids = Array.from(new Set(rows.map((r) => r.owner_id)));
  if (ids.length === 0) return new Map<string, OwnerProfile>();
  const { data } = await client
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url')
    .in('id', ids);
  const map = new Map<string, OwnerProfile>();
  for (const p of (data ?? []) as OwnerProfile[]) map.set(p.id, p);
  return map;
}

async function loadFollowingIds(
  client: Awaited<ReturnType<typeof getServerClient>>,
  userId: string | null,
  blogIds: string[]
) {
  if (!userId || blogIds.length === 0) return new Set<string>();
  const { data } = await client
    .from('blog_follows')
    .select('blog_id')
    .eq('user_id', userId)
    .in('blog_id', blogIds);
  return new Set<string>(((data ?? []) as { blog_id: string }[]).map((r) => r.blog_id));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '20') || 20, 1), 100);
  const query = searchParams.get('query')?.trim() ?? '';
  const category = searchParams.get('category')?.trim() ?? '';

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id ?? null;

  let request_ = client
    .from('blogs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (query) request_ = request_.ilike('name', `%${query}%`);
  if (category) request_ = request_.eq('category', category);

  const { data, error, count } = await request_;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as BlogRow[];
  const owners = await loadOwners(client, rows);
  const followingIds = await loadFollowingIds(
    client,
    userId,
    rows.map((r) => r.id)
  );

  const blogs = rows.map((r) => mapBlog(r, owners, { userId, followingIds }));

  return NextResponse.json({
    success: true,
    blogs,
    total: count ?? blogs.length,
    page: 1,
    limit,
    hasMore: (count ?? blogs.length) > blogs.length,
    data: blogs,
  });
}

export async function POST(request: NextRequest) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const baseSlug = slugify(name);
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: conflict } = await client
      .from('blogs')
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
    description: typeof body.description === 'string' ? body.description : '',
    category: typeof body.category === 'string' ? body.category : 'OTRO',
    subcategory: typeof body.subcategory === 'string' ? body.subcategory : null,
    profile_image_url: typeof body.profileImageUrl === 'string' ? body.profileImageUrl : null,
    cover_image_url: typeof body.coverImageUrl === 'string' ? body.coverImageUrl : null,
    website: typeof body.website === 'string' ? body.website : null,
    social: (body.social ?? {}) as Record<string, unknown>,
    tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
  };

  const { data, error } = await client
    .from('blogs')
    .insert(insertRow)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create blog' },
      { status: 500 }
    );
  }

  const row = data as BlogRow;
  const owners = await loadOwners(client, [row]);
  return NextResponse.json(mapBlog(row, owners, { userId, followingIds: new Set() }));
}
