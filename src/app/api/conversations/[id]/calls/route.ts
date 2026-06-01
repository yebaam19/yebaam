import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken, getServiceClient } from '@/utils/supabase/server';
import { mapCallRow, type CallType, type DbCallSessionRow } from '@/features/chat/calls/types';

async function getUserId(): Promise<string | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  return data?.user?.id ?? null;
}

/**
 * POST /api/conversations/[id]/calls — start a 1:1 call.
 *
 * Inserts a `ringing` row; the callee receives it via Realtime postgres_changes
 * (global incoming-call listener). Calls are 1:1 only — group conversations are
 * rejected. The DB INSERT is the "incoming call" signal; SDP/ICE ride Broadcast.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: conversationId } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as {
    calleeId?: unknown;
    callType?: unknown;
  };

  const calleeId = typeof body.calleeId === 'string' ? body.calleeId : '';
  if (!calleeId || calleeId === userId) {
    return NextResponse.json({ error: 'A valid calleeId is required' }, { status: 400 });
  }
  // callType may be omitted (defaults to video) but a *present* value must be a
  // valid enum — don't silently coerce a typo'd 'voice' into a video call.
  if (body.callType !== undefined && body.callType !== 'audio' && body.callType !== 'video') {
    return NextResponse.json({ error: 'Invalid callType' }, { status: 400 });
  }
  const callType: CallType = body.callType === 'audio' ? 'audio' : 'video';

  const db = getServiceClient();

  // Must be a DIRECT conversation (1:1 only for v1).
  const { data: conv } = await db
    .from('conversations')
    .select('id,type')
    .eq('id', conversationId)
    .maybeSingle();
  if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  if (conv.type !== 'direct') {
    return NextResponse.json({ error: 'Calls are only available in 1:1 chats' }, { status: 400 });
  }

  // Both the caller and the callee must belong to this conversation.
  const { data: parts } = await db
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId);
  const memberIds = new Set(((parts ?? []) as { user_id: string }[]).map((p) => p.user_id));
  if (!memberIds.has(userId) || !memberIds.has(calleeId)) {
    return NextResponse.json({ error: 'Not a participant of this conversation' }, { status: 403 });
  }

  // One live call per conversation. Anything still ringing/active blocks a new one.
  const { data: live } = await db
    .from('call_sessions')
    .select('id,caller_id,status,created_at')
    .eq('conversation_id', conversationId)
    .in('status', ['ringing', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (live) {
    // Treat a stale ring (>60s, never answered) as abandoned so a fresh call works.
    const ageMs = Date.now() - new Date((live as { created_at: string }).created_at).getTime();
    const isStaleRing = (live as { status: string }).status === 'ringing' && ageMs > 60_000;
    if (isStaleRing) {
      await db
        .from('call_sessions')
        .update({ status: 'missed', ended_at: new Date().toISOString(), end_reason: 'timeout' })
        .eq('id', (live as { id: string }).id);
    } else {
      return NextResponse.json({ error: 'busy' }, { status: 409 });
    }
  }

  const { data: created, error } = await db
    .from('call_sessions')
    .insert({
      conversation_id: conversationId,
      caller_id: userId,
      callee_id: calleeId,
      call_type: callType,
      status: 'ringing',
    })
    .select('*')
    .maybeSingle();

  if (error || !created) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to start call' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, data: mapCallRow(created as DbCallSessionRow) });
}
