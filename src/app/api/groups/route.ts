import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { loadGroupContext, mapGroup, type GroupRow } from '@/lib/api/groups';

export async function GET() {
  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id ?? null;

  const { data, error } = await client
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as GroupRow[];
  const ctx = await loadGroupContext(client, rows, viewerId);
  return NextResponse.json({
    groups: rows.map((r) => mapGroup(r, ctx)),
    total: rows.length,
  });
}

export async function POST(request: NextRequest) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const privacy = body.privacy === 'private' ? 'private' : 'public';

  const { data, error } = await client
    .from('groups')
    .insert({
      creator_id: userId,
      name,
      description: typeof body.description === 'string' ? body.description : '',
      cover_image_url:
        typeof body.coverImageUrl === 'string' ? body.coverImageUrl : null,
      privacy,
      category: typeof body.category === 'string' ? body.category : 'OTRO',
    })
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create group' },
      { status: 500 }
    );
  }

  const row = data as GroupRow;
  await client
    .from('group_members')
    .insert({ group_id: row.id, user_id: userId, role: 'OWNER' });

  const ctx = await loadGroupContext(client, [row], userId);
  return NextResponse.json(mapGroup(row, ctx));
}
