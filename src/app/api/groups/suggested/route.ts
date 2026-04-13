import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/insforge/server';
import { loadGroupContext, mapGroup, type GroupRow } from '@/lib/api/groups';

export async function GET() {
  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const viewerId = me?.user?.id ?? null;

  const { data, error } = await client.database
    .from('groups')
    .select('*')
    .eq('privacy', 'public')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as GroupRow[];
  const ctx = await loadGroupContext(client, rows, viewerId);
  return NextResponse.json({
    groups: rows.map((r) => mapGroup(r, ctx)),
    total: rows.length,
  });
}
