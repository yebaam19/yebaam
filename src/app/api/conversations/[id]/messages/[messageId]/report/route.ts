import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';

/**
 * Participant report on a private message — the user-side compliance trigger.
 * A pending report is what authorizes a scoped, audited decrypt of the
 * reported thread by an admin (see /api/admin/compliance/chat-decrypt);
 * without one, Yebaam never reads private content. RLS (`mr_insert_participant`)
 * enforces that only conversation participants can file one.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; messageId: string }> },
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: conversationId, messageId } = await context.params;

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const reporterId = me?.user?.id;
  if (!reporterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { reason?: string };
  const reason = body.reason?.trim().slice(0, 500) || 'contenido_inapropiado';

  // The message must be visible to the reporter (msg_select RLS = participant).
  const { data: message } = await client
    .from('messages')
    .select('id, sender_id')
    .eq('id', messageId)
    .eq('conversation_id', conversationId)
    .maybeSingle();
  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }
  if ((message as { sender_id: string }).sender_id === reporterId) {
    return NextResponse.json({ error: 'Cannot report your own message' }, { status: 400 });
  }

  const { error } = await client.from('message_reports').insert({
    message_id: messageId,
    conversation_id: conversationId,
    reporter_id: reporterId,
    reason,
  });

  // Unique (message_id, reporter_id) — an existing report is a success, not an error.
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
