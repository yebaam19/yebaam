import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { blogKey, slugify } from '@/lib/api/blogs';

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  content: string | null;
  cf_image_id: string | null;
  created_at: string;
};

function mapArticle(r: ArticleRow) {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle,
    summary: r.summary,
    content: r.content ?? '',
    cfImageId: r.cf_image_id,
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

/** Published articles for a blog (PDF #11), newest first. */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const blog = await resolveBlog(client, idOrSlug);
  if (!blog) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

  const { data, error } = await client
    .from('music_articles')
    .select('id, slug, title, subtitle, summary, content, cf_image_id, created_at')
    .eq('blog_id', blog.id)
    .not('published_at', 'is', null)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ articles: ((data ?? []) as ArticleRow[]).map(mapArticle) });
}

/** Owner-only: write a blog article (stored in music_articles with blog scope). */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
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

  const slug = `${slugify(title)}-${Math.floor(Math.random() * 100000)}`;
  const { data, error } = await client
    .from('music_articles')
    .insert({
      blog_id: blog.id,
      author_id: userId,
      slug,
      title,
      subtitle: typeof body.subtitle === 'string' && body.subtitle ? body.subtitle : null,
      summary: typeof body.summary === 'string' && body.summary ? body.summary : null,
      content,
      cf_image_id: typeof body.cfImageId === 'string' && body.cfImageId ? body.cfImageId : null,
      tags: [],
      published_at: new Date().toISOString(),
    })
    .select('id, slug, title, subtitle, summary, content, cf_image_id, created_at')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create article' }, { status: 500 });
  }
  return NextResponse.json({ article: mapArticle(data as ArticleRow) });
}
