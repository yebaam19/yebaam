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
  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id ?? null;

  const page = await resolvePage(client, idOrSlug);
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const isTeam =
    viewerId &&
    (page.ownerId === viewerId ||
      (await canManage(client, page.id, viewerId, page.ownerId)));

  let query = client
    .from('page_articles')
    .select('*')
    .eq('page_id', page.id)
    .order('published_at', { ascending: false, nullsFirst: false });

  if (!isTeam) {
    query = query.not('published_at', 'is', null);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const authorIds = Array.from(
    new Set(
      rows
        .map((r) => r.author_id as string | null)
        .filter((id): id is string => Boolean(id))
    )
  );
  const { data: profiles } = authorIds.length
    ? await client
        .from('profiles')
        .select('id,username,first_name,last_name,avatar_url')
        .in('id', authorIds)
    : { data: [] as Array<Record<string, unknown>> };

  const profileMap = new Map(
    ((profiles ?? []) as Array<Record<string, unknown>>).map((p) => [p.id as string, p])
  );

  return NextResponse.json(
    rows.map((r) => {
      const author = r.author_id ? profileMap.get(r.author_id as string) : undefined;
      return {
        id: r.id,
        pageId: r.page_id,
        title: r.title,
        description: r.description ?? null,
        body: r.body ?? null,
        coverUrl: resolveImageRef(r.cover_cf_image_id as string | null, 'cover'),
        publishedAt: r.published_at ?? null,
        createdAt: r.created_at,
        author: author
          ? {
              id: author.id,
              username: author.username,
              name:
                [author.first_name, author.last_name].filter(Boolean).join(' ') ||
                author.username,
              avatarUrl: resolveImageRef(author.avatar_url as string | undefined, 'avatar'),
            }
          : null,
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
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const publish = body.publish === true;

  const { data, error } = await client
    .from('page_articles')
    .insert({
      page_id: page.id,
      author_id: userId,
      title,
      description: typeof body.description === 'string' ? body.description : null,
      body: typeof body.body === 'string' ? body.body : null,
      cover_cf_image_id: typeof body.coverCfImageId === 'string' ? body.coverCfImageId : null,
      published_at: publish ? new Date().toISOString() : null,
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
  const articleId = new URL(request.url).searchParams.get('id');
  if (!articleId) return NextResponse.json({ error: 'id required' }, { status: 400 });

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
    .from('page_articles')
    .delete()
    .eq('id', articleId)
    .eq('page_id', page.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
