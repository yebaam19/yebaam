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

// posts.reactions_count is kept in sync by the
// `trg_reactions_sync_post_count` SECURITY DEFINER trigger on the reactions
// table (migration: posts_reactions_count_trigger). The handler used to
// recompute and UPDATE posts.reactions_count under the caller's session,
// but the posts_update_own RLS policy restricts UPDATE to the author, so
// non-authors silently failed and the denormalization drifted. The trigger
// handles every write path (this route, browser-direct supabase client,
// edge functions) without granting non-authors UPDATE rights on posts.

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

  return NextResponse.json({ success: true });
}
