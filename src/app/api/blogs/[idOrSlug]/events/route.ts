import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { blogKey } from '@/lib/api/blogs';

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
};

function mapEvent(r: EventRow) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    location: r.location,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    createdAt: r.created_at,
  };
}

async function resolveBlog(
  client: Awaited<ReturnType<typeof getServerClient>>,
  idOrSlug: string
): Promise<{ id: string; owner_id: string } | null> {
  const { data } = await client
    .from('blogs')
    .select('id, owner_id')
    .eq(blogKey(idOrSlug), idOrSlug)
    .maybeSingle();
  return (data as { id: string; owner_id: string } | null) ?? null;
}

/** Public list of a blog's events, soonest first. */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const blog = await resolveBlog(client, idOrSlug);
  if (!blog) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

  const { data, error } = await client
    .from('blog_events')
    .select('id, title, description, location, starts_at, ends_at, created_at')
    .eq('blog_id', blog.id)
    .order('starts_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ events: ((data ?? []) as EventRow[]).map(mapEvent) });
}

/** Owner-only: schedule a new event. */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const startsAt = typeof body.startsAt === 'string' ? body.startsAt : '';
  if (!title || !startsAt) {
    return NextResponse.json({ error: 'title and startsAt are required' }, { status: 400 });
  }

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blog = await resolveBlog(client, idOrSlug);
  if (!blog) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
  if (blog.owner_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await client
    .from('blog_events')
    .insert({
      blog_id: blog.id,
      created_by: userId,
      title,
      description: typeof body.description === 'string' ? body.description : null,
      location: typeof body.location === 'string' ? body.location : null,
      starts_at: startsAt,
      ends_at: typeof body.endsAt === 'string' && body.endsAt ? body.endsAt : null,
    })
    .select('id, title, description, location, starts_at, ends_at, created_at')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create event' }, { status: 500 });
  }
  return NextResponse.json({ event: mapEvent(data as EventRow) });
}
