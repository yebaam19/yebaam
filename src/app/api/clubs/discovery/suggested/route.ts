import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';
import { loadClubContext, mapClub, type ClubRow } from '@/lib/api/clubs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '12') || 12, 1), 50);
  const pageParam = searchParams.get('page');
  const page = pageParam ? Math.max(Number(pageParam) || 1, 1) : null;
  const category = searchParams.get('category')?.trim() ?? '';

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id ?? null;

  if (page === null) {
    // Legacy shape: plain array, capped by `limit`.
    let query = client
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
      rows.map((r) => mapClub(r, { userId: viewerId, ...ctx }, ctx.owners.get(r.owner_id))),
    );
  }

  // Paged shape: { items, page, totalPages, totalCount, limit }.
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = client
    .from('clubs')
    .select('*', { count: 'exact' })
    .eq('privacy', 'PUBLIC')
    .order('created_at', { ascending: false })
    .range(from, to);
  if (category) query = query.eq('category', category);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as ClubRow[];
  const ctx = await loadClubContext(client, rows, viewerId);
  const items = rows.map((r) =>
    mapClub(r, { userId: viewerId, ...ctx }, ctx.owners.get(r.owner_id)),
  );
  const totalCount = count ?? items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return NextResponse.json({ items, page, totalPages, totalCount, limit });
}
