import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { loadGroupContext, mapGroup, type GroupRow } from '@/lib/api/groups';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id ?? null;

  const { data, error } = await client
    .from('groups')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  const row = data as GroupRow;
  const ctx = await loadGroupContext(client, [row], viewerId);
  return NextResponse.json(mapGroup(row, ctx));
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id ?? null;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === 'string') patch.name = body.name;
  if (typeof body.description === 'string') patch.description = body.description;
  if (typeof body.category === 'string') patch.category = body.category;
  if (body.privacy === 'public' || body.privacy === 'private') patch.privacy = body.privacy;
  if (typeof body.coverImageUrl === 'string' || body.coverImageUrl === null) patch.cover_image_url = body.coverImageUrl;

  const { data, error } = await client
    .from('groups')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update group' },
      { status: 500 }
    );
  }

  const row = data as GroupRow;
  const ctx = await loadGroupContext(client, [row], userId);
  return NextResponse.json(mapGroup(row, ctx));
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const client = await getServerClient();
  const { error } = await client.from('groups').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
