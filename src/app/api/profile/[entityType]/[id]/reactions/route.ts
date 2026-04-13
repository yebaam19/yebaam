import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/lib/insforge/server';
import {
  VALID_REACTION_TYPES,
  normalizeReactionType,
  resolveColumn,
  mapProfileUser,
  type ProfileLite,
} from '@/lib/api/profile-media';

type ReactionRow = {
  id: string;
  type: string;
  user_id: string;
  profile_photo_id: string | null;
  profile_video_id: string | null;
  created_at: string;
};

async function refreshLikesCount(
  client: Awaited<ReturnType<typeof getServerClient>>,
  entityType: string,
  entityId: string,
  column: 'profile_photo_id' | 'profile_video_id'
) {
  const { count } = await client.database
    .from('reactions')
    .select('id', { count: 'exact', head: true })
    .eq(column, entityId);

  const table = entityType === 'photos' ? 'profile_photos' : 'profile_videos';
  await client.database
    .from(table)
    .update({ likes_count: count ?? 0 })
    .eq('id', entityId);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ entityType: string; id: string }> }
) {
  const { entityType, id } = await context.params;
  const column = resolveColumn(entityType);
  if (!column) return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const typeFilter = normalizeReactionType(searchParams.get('type'));

  const client = await getServerClient();
  let query = client.database.from('reactions').select('*').eq(column, id);
  if (typeFilter) query = query.eq('type', typeFilter);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as ReactionRow[];
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));

  const { data: profiles } = userIds.length
    ? await client.database
        .from('profiles')
        .select('id,username,first_name,last_name,avatar_url')
        .in('id', userIds)
    : { data: [] as ProfileLite[] };

  const profileMap = new Map<string, ProfileLite>();
  for (const p of (profiles ?? []) as ProfileLite[]) profileMap.set(p.id, p);

  const counts = Object.fromEntries(VALID_REACTION_TYPES.map((t) => [t, 0])) as Record<
    (typeof VALID_REACTION_TYPES)[number],
    number
  >;
  for (const r of rows) {
    const t = r.type.toLowerCase();
    if (t in counts) counts[t as keyof typeof counts] += 1;
  }

  return NextResponse.json({
    success: true,
    reactions: rows.map((r) => ({
      id: r.id,
      type: r.type,
      user: mapProfileUser(profileMap.get(r.user_id), r.user_id),
      createdAt: r.created_at,
    })),
    counts,
    total: rows.length,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ entityType: string; id: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { entityType, id } = await context.params;
  const column = resolveColumn(entityType);
  if (!column) return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { type?: string };
  const type = normalizeReactionType(body.type);
  if (!type) return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existing } = await client.database
    .from('reactions')
    .select('id')
    .eq('user_id', userId)
    .eq(column, id)
    .maybeSingle();

  if (existing) {
    const { error } = await client.database
      .from('reactions')
      .update({ type })
      .eq('id', (existing as { id: string }).id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await client.database
      .from('reactions')
      .insert({ user_id: userId, type, [column]: id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await refreshLikesCount(client, entityType, id, column);

  const { data: userProfile } = await client.database
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url')
    .eq('id', userId)
    .maybeSingle();

  return NextResponse.json({
    id: (existing as { id: string } | null)?.id ?? userId,
    type,
    user: mapProfileUser(userProfile as ProfileLite | null, userId),
    createdAt: new Date().toISOString(),
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ entityType: string; id: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { entityType, id } = await context.params;
  const column = resolveColumn(entityType);
  if (!column) return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getCurrentUser();
  const userId = me?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await client.database
    .from('reactions')
    .delete()
    .eq('user_id', userId)
    .eq(column, id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await refreshLikesCount(client, entityType, id, column);
  return NextResponse.json({ success: true });
}
