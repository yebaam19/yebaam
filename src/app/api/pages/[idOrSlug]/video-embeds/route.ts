import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { resolvePage } from '@/lib/api/page-authz';

// The extracted id feeds an iframe src verbatim — validate its shape so a
// crafted URL can never smuggle a path/query into the embed.
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{6,20}$/;
const VIMEO_ID_RE = /^\d+$/;

function parseEmbed(url: string): { provider: 'youtube' | 'vimeo'; embedId: string } | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      return id && YOUTUBE_ID_RE.test(id) ? { provider: 'youtube', embedId: id } : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v');
      if (v) return YOUTUBE_ID_RE.test(v) ? { provider: 'youtube', embedId: v } : null;
      const parts = u.pathname.split('/').filter(Boolean);
      if ((parts[0] === 'embed' || parts[0] === 'shorts') && parts[1] && YOUTUBE_ID_RE.test(parts[1])) {
        return { provider: 'youtube', embedId: parts[1] };
      }
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      const id = parts.find((p) => VIMEO_ID_RE.test(p));
      return id ? { provider: 'vimeo', embedId: id } : null;
    }
  } catch {
    return null;
  }
  return null;
}

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
    .from('page_video_embeds')
    .select('*')
    .eq('page_id', page.id)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      id: r.id,
      pageId: r.page_id,
      provider: r.provider,
      url: r.url,
      title: r.title ?? null,
      embedId: r.embed_id,
      sortOrder: r.sort_order,
      iframeSrc:
        r.provider === 'youtube'
          ? `https://www.youtube-nocookie.com/embed/${r.embed_id}`
          : `https://player.vimeo.com/video/${r.embed_id}`,
      thumbnailUrl:
        r.provider === 'youtube'
          ? `https://i.ytimg.com/vi/${r.embed_id}/hqdefault.jpg`
          : null,
    }))
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
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  const parsed = parseEmbed(url);
  if (!parsed) {
    return NextResponse.json(
      { error: 'URL debe ser de YouTube o Vimeo' },
      { status: 400 }
    );
  }

  const { data, error } = await client
    .from('page_video_embeds')
    .insert({
      page_id: page.id,
      provider: parsed.provider,
      url,
      embed_id: parsed.embedId,
      title: typeof body.title === 'string' ? body.title.trim() : null,
      created_by: userId,
      sort_order: typeof body.sortOrder === 'number' ? body.sortOrder : 0,
    })
    .select('*')
    .maybeSingle();

  if (error || !data) {
    // unique (page_id, provider, embed_id) — the same video twice is a user
    // mistake, not a server error.
    if (error?.code === '23505') {
      return NextResponse.json(
        { error: 'Este video ya fue agregado a la página', alreadyAdded: true },
        { status: 409 }
      );
    }
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
  const embedId = new URL(request.url).searchParams.get('id');
  if (!embedId) return NextResponse.json({ error: 'id required' }, { status: 400 });

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
    .from('page_video_embeds')
    .delete()
    .eq('id', embedId)
    .eq('page_id', page.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
