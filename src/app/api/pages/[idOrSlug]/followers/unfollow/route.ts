import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/lib/insforge/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolvePageId(
  client: Awaited<ReturnType<typeof getServerClient>>,
  idOrSlug: string
): Promise<string | null> {
  if (UUID_RE.test(idOrSlug)) return idOrSlug;
  const { data } = await client.database
    .from('pages')
    .select('id')
    .eq('slug', idOrSlug)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pageId = await resolvePageId(client, idOrSlug);
  if (!pageId) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const { error } = await client.database
    .from('page_followers')
    .delete()
    .eq('page_id', pageId)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count } = await client.database
    .from('page_followers')
    .select('page_id', { count: 'exact', head: true })
    .eq('page_id', pageId);
  await client.database
    .from('pages')
    .update({ follower_count: count ?? 0 })
    .eq('id', pageId);

  return NextResponse.json({ success: true });
}
