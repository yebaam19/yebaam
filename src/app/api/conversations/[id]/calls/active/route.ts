import { NextResponse } from 'next/server';
import { getServerClient, getServerAccessToken, getServiceClient } from '@/utils/supabase/server';
import { mapCallRow, type DbCallSessionRow } from '@/features/chat/calls/types';

async function getUserId(): Promise<string | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  return data?.user?.id ?? null;
}

/**
 * GET /api/conversations/[id]/calls/active — the conversation's current
 * ringing/active call for the requesting participant, if any. Lets a chat that
 * opens mid-call (refresh, late join) reflect the in-progress call.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: conversationId } = await ctx.params;
  const db = getServiceClient();

  const { data: call } = await db
    .from('call_sessions')
    .select('*')
    .eq('conversation_id', conversationId)
    .in('status', ['ringing', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!call) return NextResponse.json({ success: true, data: null });

  const row = call as DbCallSessionRow;
  if (row.caller_id !== userId && row.callee_id !== userId) {
    return NextResponse.json({ success: true, data: null });
  }

  return NextResponse.json({ success: true, data: mapCallRow(row) });
}
