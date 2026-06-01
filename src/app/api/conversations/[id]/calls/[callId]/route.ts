import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken, getServiceClient } from '@/utils/supabase/server';
import { mapCallRow, type CallAction, type DbCallSessionRow } from '@/features/chat/calls/types';

async function getUserId(): Promise<string | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  return data?.user?.id ?? null;
}

/**
 * PATCH /api/conversations/[id]/calls/[callId] — accept / decline / end a call.
 *
 * - accept  : callee only, while ringing  → status 'active'
 * - decline : callee only, while ringing  → status 'declined'
 * - end     : either party, while ringing/active → status 'ended' (a caller
 *             ending a still-ringing call = cancel; recorded as 'missed').
 *
 * Terminal states are idempotent: re-ending an already-ended call just echoes it.
 */
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; callId: string }> },
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: conversationId, callId } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as { action?: unknown; reason?: unknown };
  const action = body.action as CallAction;
  const reason = typeof body.reason === 'string' ? body.reason.slice(0, 120) : null;
  if (action !== 'accept' && action !== 'decline' && action !== 'end') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const db = getServiceClient();
  const { data: call } = await db
    .from('call_sessions')
    .select('*')
    .eq('id', callId)
    .eq('conversation_id', conversationId)
    .maybeSingle();
  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

  const row = call as DbCallSessionRow;
  const isCaller = row.caller_id === userId;
  const isCallee = row.callee_id === userId;
  if (!isCaller && !isCallee) {
    return NextResponse.json({ error: 'Not a participant of this call' }, { status: 403 });
  }

  // Already finished — idempotent echo (handles double-tap / both sides ending).
  if (row.status === 'ended' || row.status === 'declined' || row.status === 'missed') {
    return NextResponse.json({ success: true, data: mapCallRow(row) });
  }

  const now = new Date().toISOString();
  let patch: Partial<DbCallSessionRow>;

  if (action === 'accept') {
    if (!isCallee) return NextResponse.json({ error: 'Only the callee can accept' }, { status: 403 });
    if (row.status !== 'ringing') {
      return NextResponse.json({ error: 'Call is no longer ringing' }, { status: 409 });
    }
    patch = { status: 'active', accepted_at: now };
  } else if (action === 'decline') {
    if (!isCallee) return NextResponse.json({ error: 'Only the callee can decline' }, { status: 403 });
    patch = { status: 'declined', ended_at: now, end_reason: reason ?? 'declined' };
  } else {
    // end: caller cancelling an unanswered ring is recorded as 'missed'.
    const cancelledRing = isCaller && row.status === 'ringing';
    patch = {
      status: cancelledRing ? 'missed' : 'ended',
      ended_at: now,
      end_reason: reason ?? (cancelledRing ? 'cancelled' : 'ended'),
    };
  }

  const { data: updated, error } = await db
    .from('call_sessions')
    .update(patch)
    .eq('id', callId)
    .select('*')
    .maybeSingle();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? 'Failed to update call' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: mapCallRow(updated as DbCallSessionRow) });
}
