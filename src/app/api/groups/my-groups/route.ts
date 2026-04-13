import { NextResponse } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/lib/insforge/server';
import { loadGroupContext, mapGroup, type GroupRow } from '@/lib/api/groups';

export async function GET() {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ groups: [], total: 0 }, { status: 401 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ groups: [], total: 0 }, { status: 401 });

  const { data: owned } = await client.database.from('groups').select('*').eq('creator_id', userId);

  const { data: memberships } = await client.database
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);
  const memberIds = ((memberships ?? []) as Array<{ group_id: string }>).map((m) => m.group_id);
  const { data: memberGroups } = memberIds.length
    ? await client.database.from('groups').select('*').in('id', memberIds)
    : { data: [] as GroupRow[] };

  const seen = new Set<string>();
  const combined: GroupRow[] = [];
  for (const r of [...((owned ?? []) as GroupRow[]), ...((memberGroups ?? []) as GroupRow[])]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    combined.push(r);
  }
  combined.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));

  const ctx = await loadGroupContext(client, combined, userId);
  return NextResponse.json({
    groups: combined.map((r) => mapGroup(r, ctx)),
    total: combined.length,
  });
}
