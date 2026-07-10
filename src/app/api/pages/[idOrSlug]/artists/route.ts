import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { resolvePage } from '@/lib/api/page-authz';
import { resolveImageRef } from '@/lib/media/urls';

async function canManage(
  client: Awaited<ReturnType<typeof getServerClient>>,
  pageId: string,
  userId: string,
  ownerId: string
) {
  if (ownerId === userId) return true;
  const { data } = await client
    .from('page_team_members')
    .select('role')
    .eq('page_id', pageId)
    .eq('user_id', userId)
    .maybeSingle();
  const role = (data as { role?: string } | null)?.role;
  return role === 'ADMIN' || role === 'EDITOR' || role === 'OWNER';
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const { data, error } = await client
    .from('page_artists')
    .select('*')
    .eq('page_id', page.id)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const userIds = rows
    .map((r) => r.user_id as string | null)
    .filter((id): id is string => Boolean(id));

  const { data: profiles } = userIds.length
    ? await client
        .from('profiles')
        .select('id,username,first_name,last_name,avatar_url,bio')
        .in('id', userIds)
    : { data: [] as Array<Record<string, unknown>> };

  const profileMap = new Map(
    ((profiles ?? []) as Array<Record<string, unknown>>).map((p) => [p.id as string, p])
  );

  return NextResponse.json(
    rows.map((r) => {
      const profile = r.user_id ? profileMap.get(r.user_id as string) : undefined;
      const photoId = r.photo_cf_image_id as string | null;
      return {
        id: r.id,
        pageId: r.page_id,
        userId: r.user_id ?? null,
        blogId: r.blog_id ?? null,
        displayName:
          (r.display_name as string) ||
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
          (profile?.username as string) ||
          'Artista',
        description: (r.description as string | null) ?? (profile?.bio as string | null) ?? null,
        photoUrl:
          resolveImageRef(photoId, 'avatar') ||
          resolveImageRef(profile?.avatar_url as string | undefined, 'avatar') ||
          null,
        username: (profile?.username as string | undefined) ?? null,
        sortOrder: r.sort_order as number,
      };
    })
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  if (!(await canManage(client, page.id, userId, page.ownerId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
  if (!displayName) {
    return NextResponse.json({ error: 'displayName is required' }, { status: 400 });
  }

  const { data, error } = await client
    .from('page_artists')
    .insert({
      page_id: page.id,
      display_name: displayName,
      description: typeof body.description === 'string' ? body.description : null,
      user_id: typeof body.userId === 'string' ? body.userId : null,
      blog_id: typeof body.blogId === 'string' ? body.blogId : null,
      photo_cf_image_id: typeof body.photoCfImageId === 'string' ? body.photoCfImageId : null,
      sort_order: typeof body.sortOrder === 'number' ? body.sortOrder : 0,
    })
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const artistId = new URL(request.url).searchParams.get('id');
  if (!artistId) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  if (!(await canManage(client, page.id, userId, page.ownerId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await client
    .from('page_artists')
    .delete()
    .eq('id', artistId)
    .eq('page_id', page.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
