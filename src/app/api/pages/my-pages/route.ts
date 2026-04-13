import { NextResponse } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/lib/insforge/server';
import { loadPageContext, mapPage, type PageRow } from '@/lib/api/pages';

export async function GET() {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json([], { status: 401 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json([], { status: 401 });

  const { data, error } = await client.database
    .from('pages')
    .select('*')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as PageRow[];
  const ctx = await loadPageContext(client, rows, userId);
  return NextResponse.json(rows.map((r) => mapPage(r, ctx)));
}
