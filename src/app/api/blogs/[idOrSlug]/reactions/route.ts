import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { blogKey } from '@/lib/api/blogs';

type Kind = 'like' | 'recommend';

function parseKind(value: string | null): Kind | null {
  return value === 'like' || value === 'recommend' ? value : null;
}

async function resolveBlogId(
  client: Awaited<ReturnType<typeof getServerClient>>,
  idOrSlug: string
): Promise<string | null> {
  const { data } = await client
    .from('blogs')
    .select('id')
    .eq(blogKey(idOrSlug), idOrSlug)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/** Add the viewer's blog-level reaction (PDF #2: like / recommend are counted). */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const kind = parseKind(new URL(request.url).searchParams.get('kind'));
  if (!kind) return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });

  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blogId = await resolveBlogId(client, idOrSlug);
  if (!blogId) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

  // Idempotent: ON CONFLICT DO NOTHING (ignoreDuplicates) so a repeat reaction
  // is a no-op and doesn't require an UPDATE policy on blog_reactions.
  const { error } = await client
    .from('blog_reactions')
    .upsert(
      { blog_id: blogId, user_id: userId, kind },
      { onConflict: 'blog_id,user_id,kind', ignoreDuplicates: true }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

/** Remove the viewer's blog-level reaction. */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const kind = parseKind(new URL(request.url).searchParams.get('kind'));
  if (!kind) return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });

  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blogId = await resolveBlogId(client, idOrSlug);
  if (!blogId) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

  const { error } = await client
    .from('blog_reactions')
    .delete()
    .eq('blog_id', blogId)
    .eq('user_id', userId)
    .eq('kind', kind);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
