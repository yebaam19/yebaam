import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/lib/insforge/server';
import { loadClubContext, mapClub, type ClubRow } from '@/lib/api/clubs';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const viewerId = me?.user?.id ?? null;

  const { data, error } = await client.database
    .from('clubs')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Club not found' }, { status: 404 });

  const row = data as ClubRow;
  const ctx = await loadClubContext(client, [row], viewerId);
  return NextResponse.json(mapClub(row, { userId: viewerId, ...ctx }, ctx.owners.get(row.owner_id)));
}
