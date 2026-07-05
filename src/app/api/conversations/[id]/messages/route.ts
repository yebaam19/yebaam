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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: conversationId } = await context.params;
  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const limitRaw = Number(searchParams.get('limit') ?? '50');
  const offsetRaw = Number(searchParams.get('offset') ?? '0');
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 && limitRaw <= 200 ? limitRaw : 50;
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

  const client = await getServerClient();

  const { data: authUser } = await client.auth.getUser();
  const viewerId = authUser?.user?.id;
  if (!viewerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Reject lookups by arbitrary UUID: without this, `/chat/<userId>` was treated as a
  // conversation id when the messages query returned zero rows under RLS, breaking sends.
  const { data: membership, error: memberErr } = await client
    .from('conversation_participants')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', viewerId)
    .maybeSingle();

  if (memberErr) {
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }
  if (!membership) {
    return NextResponse.json(
      { error: 'Not a participant in this conversation' },
      { status: 403 },
    );
  }

  // Deleted messages are kept (is_deleted=true) and returned so the UI can show
  // a "Mensaje eliminado" tombstone (Facebook-style) that survives reloads.
  const { data, error, count } = await client
    .from('messages')
    .select('*', { count: 'exact' })
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const messages = ((data ?? []) as MessageRow[]).map(mapMessage);
  const total = typeof count === 'number' ? count : messages.length;

  return NextResponse.json({
    success: true,
    data: messages,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + messages.length < total,
    },
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: conversationId } = await context.params;
  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    content?: string;
    media?: unknown;
    replyToId?: string;
  };

  const content = (body.content ?? '').trim();
  if (!content && !body.media) {
    return NextResponse.json({ error: 'content or media is required' }, { status: 400 });
  }

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const senderId = me?.user?.id;
  if (!senderId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Membership check via the conversation row itself (`conv_select` RLS =
  // is_conversation_participant), which also yields club_id for the
  // encryption policy gate in the same round-trip.
  const { data: conv, error: memberErr } = await client
    .from('conversations')
    .select('id, club_id')
    .eq('id', conversationId)
    .maybeSingle();

  if (memberErr) {
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }
  if (!conv) {
    return NextResponse.json(
      { error: 'Not a participant in this conversation' },
      { status: 403 },
    );
  }

  const storedContent = isPrivateConversation(conv as { club_id: string | null })
    ? encryptChatContent(content, conversationId)
    : content;

  const { data: inserted, error } = await client
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: storedContent || '',
      media: body.media ?? null,
      reply_to_id: body.replyToId ?? null,
      status: 'sent',
    })
    .select('*')
    .maybeSingle();

  if (error || !inserted) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to send message' },
      { status: 500 }
    );
  }

  await client
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return NextResponse.json({ success: true, data: mapMessage(inserted as MessageRow) });
}
