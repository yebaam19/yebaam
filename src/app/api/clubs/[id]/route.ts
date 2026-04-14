import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { loadClubContext, mapClub, type ClubRow } from '@/lib/api/clubs';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id ?? null;

  const { data, error } = await client
    .from('clubs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Club not found' }, { status: 404 });

  const row = data as ClubRow;
  const ctx = await loadClubContext(client, [row], viewerId);
  return NextResponse.json(mapClub(row, { userId: viewerId, ...ctx }, ctx.owners.get(row.owner_id)));
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
  if (typeof body.subcategory === 'string' || body.subcategory === null) patch.subcategory = body.subcategory;
  if (typeof body.privacy === 'string') patch.privacy = body.privacy;
  if (typeof body.profileImageUrl === 'string' || body.profileImageUrl === null) patch.profile_image_url = body.profileImageUrl;
  if (typeof body.coverImageUrl === 'string' || body.coverImageUrl === null) patch.cover_image_url = body.coverImageUrl;
  if (Array.isArray(body.rules)) patch.rules = body.rules;
  if (typeof body.location === 'string' || body.location === null) patch.location = body.location;
  if (typeof body.website === 'string' || body.website === null) patch.website = body.website;
  if (Array.isArray(body.tags)) patch.tags = body.tags;

  const { data, error } = await client
    .from('clubs')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update club' },
      { status: 500 }
    );
  }

  const row = data as ClubRow;
  const ctx = await loadClubContext(client, [row], userId);
  return NextResponse.json(mapClub(row, { userId, ...ctx }, ctx.owners.get(row.owner_id)));
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const client = await getServerClient();
  const { error } = await client.from('clubs').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
