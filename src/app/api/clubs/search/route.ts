import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/lib/insforge/server';
import { loadClubContext, mapClub, type ClubRow } from '@/lib/api/clubs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim() ?? searchParams.get('q')?.trim() ?? '';
  const category = searchParams.get('category')?.trim() ?? '';
  const privacy = searchParams.get('privacy')?.trim() ?? '';
  const page = Math.max(Number(searchParams.get('page') ?? '1') || 1, 1);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '20') || 20, 1), 100);
  const offset = (page - 1) * limit;

  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const viewerId = me?.user?.id ?? null;

  let q = client.database
    .from('clubs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (query) q = q.ilike('name', `%${query}%`);
  if (category) q = q.eq('category', category);
  if (privacy) q = q.eq('privacy', privacy);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as ClubRow[];
  const ctx = await loadClubContext(client, rows, viewerId);
  const clubs = rows.map((r) =>
    mapClub(r, { userId: viewerId, ...ctx }, ctx.owners.get(r.owner_id))
  );

  const total = count ?? clubs.length;
  return NextResponse.json({
    clubs,
    total,
    page,
    limit,
    hasMore: offset + clubs.length < total,
  });
}
