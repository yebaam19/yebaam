import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/lib/insforge/server';
import { loadClubContext, mapClub, type ClubRow } from '@/lib/api/clubs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '10') || 10, 1), 50);
  const category = searchParams.get('category')?.trim() ?? '';

  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const viewerId = me?.user?.id ?? null;

  let query = client.database
    .from('clubs')
    .select('*')
    .eq('privacy', 'PUBLIC')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as ClubRow[];
  const ctx = await loadClubContext(client, rows, viewerId);
  return NextResponse.json(
    rows.map((r) => mapClub(r, { userId: viewerId, ...ctx }, ctx.owners.get(r.owner_id)))
  );
}
