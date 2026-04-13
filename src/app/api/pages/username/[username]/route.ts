import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/lib/insforge/server';
import { loadPageContext, mapPage, type PageRow } from '@/lib/api/pages';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const viewerId = me?.user?.id ?? null;

  const { data, error } = await client.database
    .from('pages')
    .select('*')
    .eq('slug', username)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const row = data as PageRow;
  const ctx = await loadPageContext(client, [row], viewerId);
  const page = mapPage(row, ctx);
  return NextResponse.json({ page, isFollowing: page.isFollowing, userRole: page.userRole });
}
