import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/lib/insforge/server';
import { loadPageContext, mapPage, type PageRow } from '@/lib/api/pages';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '10') || 10, 1), 50);

  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const viewerId = me?.user?.id ?? null;

  const { data, error } = await client.database
    .from('pages')
    .select('*')
    .eq('privacy', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as PageRow[];
  const ctx = await loadPageContext(client, rows, viewerId);
  return NextResponse.json(rows.map((r) => mapPage(r, ctx)));
}
