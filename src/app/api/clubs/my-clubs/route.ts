import { NextResponse } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/lib/insforge/server';
import { loadClubContext, mapClub, type ClubRow } from '@/lib/api/clubs';

export async function GET() {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json([], { status: 401 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json([], { status: 401 });

  const { data: ownedRes } = await client.database.from('clubs').select('*').eq('owner_id', userId);
  const { data: memberships } = await client.database
    .from('club_members')
    .select('club_id')
    .eq('user_id', userId);

  const memberClubIds = ((memberships ?? []) as Array<{ club_id: string }>).map((m) => m.club_id);
  const { data: memberClubs } = memberClubIds.length
    ? await client.database.from('clubs').select('*').in('id', memberClubIds)
    : { data: [] as ClubRow[] };

  const seen = new Set<string>();
  const combined: ClubRow[] = [];
  for (const row of [...((ownedRes ?? []) as ClubRow[]), ...((memberClubs ?? []) as ClubRow[])]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    combined.push(row);
  }
  combined.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));

  const ctx = await loadClubContext(client, combined, userId);
  return NextResponse.json(
    combined.map((r) => mapClub(r, { userId, ...ctx }, ctx.owners.get(r.owner_id)))
  );
}
