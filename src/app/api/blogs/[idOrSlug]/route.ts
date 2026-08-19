import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { mapBlog, tearDownBlogSideArtifacts, type BlogRow, type OwnerProfile } from '@/lib/api/blogs';
import { isValidWebsite } from '@/lib/safe-href';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadBlog(
  client: Awaited<ReturnType<typeof getServerClient>>,
  idOrSlug: string
) {
  const query = client.from('blogs').select('*');
  const { data } = UUID_RE.test(idOrSlug)
    ? await query.eq('id', idOrSlug).maybeSingle()
    : await query.eq('slug', idOrSlug).maybeSingle();
  return (data ?? null) as BlogRow | null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id ?? null;

  const row = await loadBlog(client, idOrSlug);
  if (!row) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

  const { data: owner } = await client
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url')
    .eq('id', row.owner_id)
    .maybeSingle();

  const ownerMap = new Map<string, OwnerProfile>();
  if (owner) ownerMap.set(row.owner_id, owner as OwnerProfile);

  const followingIds = new Set<string>();
  const likedIds = new Set<string>();
  const recommendedIds = new Set<string>();
  if (userId) {
    const { data: follow } = await client
      .from('blog_follows')
      .select('blog_id')
      .eq('user_id', userId)
      .eq('blog_id', row.id)
      .maybeSingle();
    if (follow) followingIds.add(row.id);

    const { data: reactions } = await client
      .from('blog_reactions')
      .select('kind')
      .eq('user_id', userId)
      .eq('blog_id', row.id);
    for (const r of (reactions ?? []) as { kind: string }[]) {
      if (r.kind === 'like') likedIds.add(row.id);
      else if (r.kind === 'recommend') recommendedIds.add(row.id);
    }
  }

  const { data: badgeRows } = await client
    .from('blog_badges')
    .select('badges(slug,name,category,icon_cf_image_id)')
    .eq('blog_id', row.id);
  // Supabase types the to-one relation as an array; normalize to one object.
  const badges = ((badgeRows ?? []) as unknown as Array<{
    badges: { slug: string; name: string; category: string; icon_cf_image_id: string | null } | null;
  }>)
    .map((r) => r.badges)
    .filter((b): b is NonNullable<typeof b> => !!b)
    .map((b) => ({ slug: b.slug, name: b.name, category: b.category, iconCfImageId: b.icon_cf_image_id }));

  let musicArtist: { id: string; name: string } | null = null;
  if (row.music_artist_id) {
    const { data: ma } = await client
      .from('music_artists')
      .select('id, name')
      .eq('id', row.music_artist_id)
      .maybeSingle();
    if (ma) musicArtist = ma as { id: string; name: string };
  }

  return NextResponse.json(
    mapBlog(row, ownerMap, { userId, followingIds, likedIds, recommendedIds }, { badges, musicArtist })
  );
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.website !== undefined && !isValidWebsite(body.website)) {
    return NextResponse.json({ error: 'website must be an http(s) URL' }, { status: 400 });
  }

  const client = await getServerClient();
  const row = await loadBlog(client, idOrSlug);
  if (!row) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === 'string') patch.name = body.name;
  if (typeof body.description === 'string') patch.description = body.description;
  if (typeof body.category === 'string') patch.category = body.category;
  if (typeof body.subcategory === 'string' || body.subcategory === null) patch.subcategory = body.subcategory;
  if (typeof body.profileImageUrl === 'string' || body.profileImageUrl === null) patch.profile_image_url = body.profileImageUrl;
  if (typeof body.coverImageUrl === 'string' || body.coverImageUrl === null) patch.cover_image_url = body.coverImageUrl;
  if (typeof body.website === 'string' || body.website === null) patch.website = body.website;
  if (body.social && typeof body.social === 'object') patch.social = body.social;
  if (Array.isArray(body.tags)) patch.tags = body.tags;
  // "Mi Música" linkage to a catalog artist (nullable).
  if (typeof body.musicArtistId === 'string' || body.musicArtistId === null) {
    patch.music_artist_id = body.musicArtistId;
  }

  const { data, error } = await client
    .from('blogs')
    .update(patch)
    .eq('id', row.id)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update blog' },
      { status: 500 }
    );
  }

  const updated = data as BlogRow;
  const { data: owner } = await client
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url')
    .eq('id', updated.owner_id)
    .maybeSingle();
  const ownerMap = new Map<string, OwnerProfile>();
  if (owner) ownerMap.set(updated.owner_id, owner as OwnerProfile);

  return NextResponse.json(mapBlog(updated, ownerMap, { userId: updated.owner_id, followingIds: new Set() }));
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const row = await loadBlog(client, idOrSlug);
  if (!row) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
  if (row.owner_id !== auth.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Clean up entity-scoped artefacts (forum space, public-chat topic) before
  // dropping the blog row so they don't linger as orphans in shared tables.
  await tearDownBlogSideArtifacts(row.id);

  const { error } = await client.from('blogs').delete().eq('id', row.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
