import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';

const VALID_TYPES = ['like', 'love', 'haha', 'wow', 'sad', 'angry'] as const;
type ReactionType = (typeof VALID_TYPES)[number];

function normalizeType(raw: unknown): ReactionType | null {
  if (typeof raw !== 'string') return null;
  const value = raw.toLowerCase();
  return (VALID_TYPES as readonly string[]).includes(value) ? (value as ReactionType) : null;
}

async function requireUser() {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  return { client, userId: data?.user?.id ?? null };
}

async function refreshReactionCounts(
  client: Awaited<ReturnType<typeof getServerClient>>,
  postId: string
) {
  const counts = { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 };
  const { data } = await client
    .from('reactions')
    .select('type')
    .eq('post_id', postId);

  for (const row of (data ?? []) as { type: string }[]) {
    const t = row.type?.toLowerCase() as ReactionType;
    if (t && t in counts) counts[t] += 1;
  }

  await client
    .from('posts')
    .update({ reactions_count: counts, updated_at: new Date().toISOString() })
    .eq('id', postId);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: postId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { type?: string };
  const type = normalizeType(body.type);
  if (!type) return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });

  const { client, userId } = await requireUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existing } = await client
    .from('reactions')
    .select('id,type')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle();

  if (existing) {
    const { error } = await client
      .from('reactions')
      .update({ type })
      .eq('id', (existing as { id: string }).id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await client
      .from('reactions')
      .insert({ user_id: userId, post_id: postId, type });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await refreshReactionCounts(client, postId);
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return POST(request, context);
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: postId } = await context.params;
  const { client, userId } = await requireUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await client
    .from('reactions')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await refreshReactionCounts(client, postId);
  return NextResponse.json({ success: true });
}
