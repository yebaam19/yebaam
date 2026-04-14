import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { loadPageContext, mapPage, type PageRow } from '@/lib/api/pages';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadPage(
  client: Awaited<ReturnType<typeof getServerClient>>,
  idOrSlug: string
) {
  const query = client.from('pages').select('*');
  const { data } = UUID_RE.test(idOrSlug)
    ? await query.eq('id', idOrSlug).maybeSingle()
    : await query.eq('slug', idOrSlug).maybeSingle();
  return (data ?? null) as PageRow | null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id ?? null;

  const row = await loadPage(client, idOrSlug);
  if (!row) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const ctx = await loadPageContext(client, [row], viewerId);
  return NextResponse.json(mapPage(row, ctx));
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
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id ?? null;

  const row = await loadPage(client, idOrSlug);
  if (!row) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === 'string') patch.name = body.name;
  if (typeof body.description === 'string') patch.description = body.description;
  if (typeof body.category === 'string') patch.category = body.category;
  if (typeof body.subcategory === 'string' || body.subcategory === null) patch.subcategory = body.subcategory;
  if (typeof body.profileImageUrl === 'string' || body.profileImageUrl === null) patch.profile_image_url = body.profileImageUrl;
  if (typeof body.coverImageUrl === 'string' || body.coverImageUrl === null) patch.cover_image_url = body.coverImageUrl;
  if (body.contact && typeof body.contact === 'object') patch.contact = body.contact;
  if (typeof body.privacy === 'string') patch.privacy = body.privacy;

  const { data, error } = await client
    .from('pages')
    .update(patch)
    .eq('id', row.id)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update page' },
      { status: 500 }
    );
  }

  const updated = data as PageRow;
  const ctx = await loadPageContext(client, [updated], userId);
  return NextResponse.json(mapPage(updated, ctx));
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const row = await loadPage(client, idOrSlug);
  if (!row) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const { error } = await client.from('pages').delete().eq('id', row.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
