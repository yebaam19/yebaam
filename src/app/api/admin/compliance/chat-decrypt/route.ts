import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken, getServiceClient } from '@/utils/supabase/server';
import { decryptChatContent } from '@/lib/server/chat-crypto';

/**
 * Audited compliance decrypt for private chat (Macro Reglamento Art. 12 / 11).
 *
 * Private messages are ciphertext at rest and Yebaam does NOT read them in the
 * normal course of operation (Art. 2 Safe Harbor). This endpoint is the single
 * lawful exception, restricted to platform admins and to exactly two legal
 * bases:
 *  - `art12_judicial`      — the ≤12h judicial-cooperation protocol
 *  - `participant_report`  — a participant reported a message; scope is that
 *                            thread only and the report id is mandatory
 * Every invocation writes to the append-only `compliance_access_log` BEFORE
 * any plaintext is produced; if the audit insert fails, nothing is decrypted.
 */

const THREAD_LIMIT = 500;

type DecryptRequest = {
  conversationId?: string;
  messageId?: string;
  legalBasis?: string;
  reason?: string;
  reportId?: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media: unknown;
  is_deleted: boolean;
  created_at: string;
};

export async function POST(request: NextRequest) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const actorId = me?.user?.id;
  if (!actorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: adminRow } = await client
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', actorId)
    .maybeSingle();
  if (!adminRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as DecryptRequest;
  const conversationId = body.conversationId?.trim();
  const messageId = body.messageId?.trim() || null;
  const legalBasis = body.legalBasis?.trim();
  const reason = body.reason?.trim() ?? '';
  const reportId = body.reportId?.trim() || null;

  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
  }
  if (legalBasis !== 'art12_judicial' && legalBasis !== 'participant_report') {
    return NextResponse.json(
      { error: "legalBasis must be 'art12_judicial' or 'participant_report'" },
      { status: 400 },
    );
  }
  if (reason.length < 10) {
    return NextResponse.json(
      { error: 'reason is required (minimum 10 characters — cite the case/report)' },
      { status: 400 },
    );
  }

  const db = getServiceClient();

  if (legalBasis === 'participant_report') {
    if (!reportId) {
      return NextResponse.json(
        { error: 'reportId is required for participant_report' },
        { status: 400 },
      );
    }
    const { data: report } = await db
      .from('message_reports')
      .select('id, conversation_id')
      .eq('id', reportId)
      .maybeSingle();
    if (!report || report.conversation_id !== conversationId) {
      return NextResponse.json(
        { error: 'Report not found or does not belong to this conversation' },
        { status: 400 },
      );
    }
  }

  const { data: conv } = await db
    .from('conversations')
    .select('id, club_id')
    .eq('id', conversationId)
    .maybeSingle();
  if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

  // The audit row is written FIRST; a failure here aborts the decrypt.
  const { error: auditErr } = await db.from('compliance_access_log').insert({
    actor_id: actorId,
    action: messageId ? 'decrypt_message' : 'decrypt_thread',
    legal_basis: legalBasis,
    conversation_id: conversationId,
    message_id: messageId,
    report_id: reportId,
    reason,
  });
  if (auditErr) {
    return NextResponse.json(
      { error: `Audit log write failed — decryption aborted: ${auditErr.message}` },
      { status: 500 },
    );
  }

  let query = db
    .from('messages')
    .select('id, conversation_id, sender_id, content, media, is_deleted, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(THREAD_LIMIT);
  if (messageId) query = query.eq('id', messageId);

  const { data: rows, error: msgErr } = await query;
  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  const messages = ((rows ?? []) as MessageRow[]).map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    content: decryptChatContent(row.content, row.conversation_id),
    media: row.media ?? null,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
  }));

  return NextResponse.json({
    success: true,
    data: { conversationId, legalBasis, messageCount: messages.length, messages },
  });
}
