import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';

const VALID_ROLES = ['OWNER', 'ADMIN', 'EDITOR', 'MODERATOR'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolvePageId(
  client: Awaited<ReturnType<typeof getServerClient>>,
  idOrSlug: string
): Promise<string | null> {
  if (UUID_RE.test(idOrSlug)) return idOrSlug;
  const { data } = await client
    .from('pages')
    .select('id')
    .eq('slug', idOrSlug)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ idOrSlug: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idOrSlug } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { userId?: string; role?: string };
  if (!body.userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  const role = (body.role ?? 'ADMIN').toUpperCase();
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const client = await getServerClient();
  const pageId = await resolvePageId(client, idOrSlug);
  if (!pageId) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const { data: existing } = await client
    .from('page_team_members')
    .select('user_id')
    .eq('page_id', pageId)
    .eq('user_id', body.userId)
    .maybeSingle();

  if (existing) {
    const { error } = await client
      .from('page_team_members')
      .update({ role })
      .eq('page_id', pageId)
      .eq('user_id', body.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await client
      .from('page_team_members')
      .insert({ page_id: pageId, user_id: body.userId, role });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
