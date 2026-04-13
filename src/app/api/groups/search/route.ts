import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/lib/insforge/server';
import { loadGroupContext, mapGroup, type GroupRow } from '@/lib/api/groups';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? searchParams.get('query')?.trim() ?? '';

  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const viewerId = me?.user?.id ?? null;

  let request_ = client.database.from('groups').select('*').limit(50);
  if (query) request_ = request_.ilike('name', `%${query}%`);

  const { data, error } = await request_;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as GroupRow[];
  const ctx = await loadGroupContext(client, rows, viewerId);
  return NextResponse.json({
    groups: rows.map((r) => mapGroup(r, ctx)),
    total: rows.length,
  });
}
