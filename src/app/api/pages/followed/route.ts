import { NextResponse } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { loadPageContext, mapPage, type PageRow } from '@/lib/api/pages';

export async function GET() {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json([], { status: 401 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json([], { status: 401 });

  const { data: follows } = await client
    .from('page_followers')
    .select('page_id')
    .eq('user_id', userId);

  const pageIds = ((follows ?? []) as Array<{ page_id: string }>).map((r) => r.page_id);
  if (pageIds.length === 0) return NextResponse.json([]);

  const { data, error } = await client
    .from('pages')
    .select('*')
    .in('id', pageIds)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as PageRow[];
  const ctx = await loadPageContext(client, rows, userId);
  return NextResponse.json(rows.map((r) => mapPage(r, ctx)));
}
