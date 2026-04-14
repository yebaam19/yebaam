import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import { mapProfileUser, resolveColumn, type ProfileLite } from '@/lib/api/profile-media';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ entityType: string; id: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ reaction: null });

  const { entityType, id } = await context.params;
  const column = resolveColumn(entityType);
  if (!column) return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ reaction: null });

  const { data } = await client
    .from('reactions')
    .select('id,type,created_at,user_id')
    .eq('user_id', userId)
    .eq(column, id)
    .maybeSingle();

  if (!data) return NextResponse.json({ reaction: null });

  const row = data as { id: string; type: string; created_at: string; user_id: string };
  const { data: profile } = await client
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url')
    .eq('id', userId)
    .maybeSingle();

  return NextResponse.json({
    reaction: {
      id: row.id,
      type: row.type,
      user: mapProfileUser(profile as ProfileLite | null, userId),
      createdAt: row.created_at,
    },
  });
}
