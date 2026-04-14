import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { loadPageContext, mapPage, slugify, type PageRow } from '@/lib/api/pages';

export async function GET() {
  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id ?? null;

  const { data, error } = await client
    .from('pages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as PageRow[];
  const ctx = await loadPageContext(client, rows, viewerId);
  return NextResponse.json({
    pages: rows.map((r) => mapPage(r, ctx)),
    total: rows.length,
    page: 1,
    limit: 50,
    hasMore: false,
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

  const baseSlug = typeof body.slug === 'string' ? slugify(body.slug) : slugify(name);
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: conflict } = await client
      .from('pages')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!conflict) break;
    slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
  }

  const { data, error } = await client
    .from('pages')
    .insert({
      owner_id: userId,
      name,
      slug,
      description: typeof body.description === 'string' ? body.description : '',
      category: typeof body.category === 'string' ? body.category : 'OTHER',
      subcategory: typeof body.subcategory === 'string' ? body.subcategory : null,
      profile_image_url: typeof body.profileImageUrl === 'string' ? body.profileImageUrl : null,
      cover_image_url: typeof body.coverImageUrl === 'string' ? body.coverImageUrl : null,
      contact: (body.contact ?? {}) as Record<string, unknown>,
      privacy: typeof body.privacy === 'string' ? body.privacy : 'public',
    })
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create page' },
      { status: 500 }
    );
  }

  const row = data as PageRow;
  const ctx = await loadPageContext(client, [row], userId);
  return NextResponse.json(mapPage(row, ctx));
}
