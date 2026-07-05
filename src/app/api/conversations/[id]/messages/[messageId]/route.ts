import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken } from '@/utils/supabase/server';
import {
  decryptChatContent,
  encryptChatContent,
  isPrivateConversation,
} from '@/lib/server/chat-crypto';

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media: unknown;
  status: string;
  reply_to_id: string | null;
  is_deleted: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapMessage(row: MessageRow) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: decryptChatContent(row.content, row.conversation_id),
    media: row.media ?? null,
    status: row.status,
    replyToId: row.reply_to_id,
    isDeleted: row.is_deleted,
    editedAt: row.edited_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch one message, decrypted. Realtime subscribers receive the raw row —
 * ciphertext for private conversations — and call this to resolve the
 * plaintext. `msg_select` RLS already restricts the read to participants.
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string; messageId: string }> }) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: conversationId, messageId } = await context.params;

  const client = await getServerClient();
  const { data, error } = await client
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .eq('conversation_id', conversationId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

  return NextResponse.json({ success: true, data: mapMessage(data as MessageRow) });
}

/**
 * Edit a message's text (sender only). RLS `msg_update` already gates updates to
 * `sender_id = auth.uid()`, so the session client can't touch someone else's
 * message. We additionally scope by sender_id + conversation_id defensively.
 * Media-only messages can't be edited (no text to change).
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string; messageId: string }> }) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: conversationId, messageId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { content?: string };
  const content = (body.content ?? '').trim();
  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const senderId = me?.user?.id;
  if (!senderId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Same policy gate as the send path: private conversations store ciphertext.
  const { data: conv } = await client
    .from('conversations')
    .select('id, club_id')
    .eq('id', conversationId)
    .maybeSingle();
  const storedContent =
    conv && isPrivateConversation(conv as { club_id: string | null })
      ? encryptChatContent(content, conversationId)
      : content;

  const now = new Date().toISOString();
  const { data, error } = await client
    .from('messages')
    .update({ content: storedContent, edited_at: now, updated_at: now })
    .eq('id', messageId)
    .eq('conversation_id', conversationId)
    .eq('sender_id', senderId)
    .eq('is_deleted', false)
    .select('*')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Message not found or not yours' }, { status: 403 });

  return NextResponse.json({ success: true, data: mapMessage(data as MessageRow) });
}

/**
 * Remove a message (sender only) — soft delete. We flip `is_deleted` and clear
 * the content/media so the tombstone can't leak the original; the row stays so
 * a "Mensaje eliminado" placeholder persists (Facebook-style) and the change
 * broadcasts to subscribers via the same Realtime UPDATE stream.
 */
export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string; messageId: string }> }) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: conversationId, messageId } = await context.params;

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const senderId = me?.user?.id;
  if (!senderId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await client
    .from('messages')
    .update({ is_deleted: true, content: '', media: null, updated_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('conversation_id', conversationId)
    .eq('sender_id', senderId)
    .select('*')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Message not found or not yours' }, { status: 403 });

  return NextResponse.json({ success: true, data: mapMessage(data as MessageRow) });
}
