import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken, getServiceClient } from '@/utils/supabase/server';
import { withRetry } from '@/utils/supabase/with-retry';

type ParticipantRow = {
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
};

type ConversationRow = {
  id: string;
  type: string;
  name: string | null;
  avatar: string | null;
  created_by: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

async function getUserId(): Promise<string | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  return data?.user?.id ?? null;
}

export async function GET() {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ success: true, data: [], count: 0 });

  const client = await getServerClient();
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ success: true, data: [], count: 0 });

  const { data: myParts, error: partsErr } = await withRetry(() =>
    client
      .from('conversation_participants')
      .select('conversation_id,last_read_at')
      .eq('user_id', userId),
  );

  if (partsErr) {
    return NextResponse.json({ error: partsErr.message }, { status: 500 });
  }

  const conversationIds = (myParts ?? []).map((p: Partial<ParticipantRow>) => p.conversation_id).filter(Boolean) as string[];
  if (conversationIds.length === 0) {
    return NextResponse.json({ success: true, data: [], count: 0 });
  }

  const { data: convs, error: convErr } = await withRetry(() =>
    client
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false }),
  );

  if (convErr) {
    return NextResponse.json({ error: convErr.message }, { status: 500 });
  }

  const { data: allParts } = await withRetry(() =>
    client
      .from('conversation_participants')
      .select('conversation_id,user_id,last_read_at')
      .in('conversation_id', conversationIds),
  );

  // Fetch only the latest message per conversation. A single unbounded
  // `in('conversation_id', …)` pulls every message in every conversation,
  // which OOM-killed Postgres in the small dev container.
  const lastMsgResults = await Promise.all(
    conversationIds.map((cid) =>
      withRetry(() =>
        client
          .from('messages')
          .select('id,conversation_id,sender_id,content,created_at')
          .eq('conversation_id', cid)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ),
    ),
  );
  const recentMsgs = lastMsgResults
    .map((r) => (r.data as MessageRow | null))
    .filter((m): m is MessageRow => m !== null);

  const partsByConv = new Map<string, ParticipantRow[]>();
  for (const p of (allParts ?? []) as ParticipantRow[]) {
    if (!partsByConv.has(p.conversation_id)) partsByConv.set(p.conversation_id, []);
    partsByConv.get(p.conversation_id)!.push(p);
  }

  const lastMsgByConv = new Map<string, MessageRow>();
  for (const m of recentMsgs) {
    lastMsgByConv.set(m.conversation_id, m);
  }

  const mine = new Map<string, ParticipantRow>();
  for (const p of (myParts ?? []) as ParticipantRow[]) mine.set(p.conversation_id, p);

  const result = ((convs ?? []) as ConversationRow[]).map((c) => {
    const participants = partsByConv.get(c.id) ?? [];
    const last = lastMsgByConv.get(c.id) ?? null;
    const myPart = mine.get(c.id);
    const meta = c.metadata ?? {};
    return {
      id: c.id,
      type: c.type,
      name: c.name,
      avatar: c.avatar,
      participantIds: participants.map((p) => p.user_id),
      lastMessage: last
        ? {
            id: last.id,
            content: last.content,
            senderId: last.sender_id,
            createdAt: last.created_at,
          }
        : null,
      unreadCount: 0,
      lastReadAt: myPart?.last_read_at ?? null,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      metadata: meta,
      isEncrypted: Boolean((meta as { is_encrypted?: boolean }).is_encrypted),
      encryptionEnabledAt: (meta as { encryption_enabled_at?: string }).encryption_enabled_at ?? null,
    };
  });

  return NextResponse.json({ success: true, data: result, count: result.length });
}

export async function POST(request: NextRequest) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { participantId } = (await request.json().catch(() => ({}))) as {
    participantId?: string;
  };
  if (!participantId) {
    return NextResponse.json({ error: 'participantId is required' }, { status: 400 });
  }
  if (participantId === userId) {
    return NextResponse.json({ error: 'Cannot start a conversation with yourself' }, { status: 400 });
  }

  const db = getServiceClient();

  const { data: myParts } = await db
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  const myConvIds = ((myParts ?? []) as { conversation_id: string }[]).map((r) => r.conversation_id);

  if (myConvIds.length > 0) {
    const { data: shared } = await db
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', participantId)
      .in('conversation_id', myConvIds);

    const sharedIds = ((shared ?? []) as { conversation_id: string }[]).map((r) => r.conversation_id);

    if (sharedIds.length > 0) {
      const { data: directs } = await db
        .from('conversations')
        .select('*')
        .in('id', sharedIds)
        .eq('type', 'direct');

      const existing = ((directs ?? []) as ConversationRow[])[0];
      if (existing) {
        return NextResponse.json({
          success: true,
          data: {
            id: existing.id,
            type: existing.type,
            name: existing.name,
            avatar: existing.avatar,
            participantIds: [userId, participantId],
            lastMessage: null,
            unreadCount: 0,
            lastReadAt: null,
            createdAt: existing.created_at,
            updatedAt: existing.updated_at,
            isEncrypted: false,
            encryptionEnabledAt: null,
          },
        });
      }
    }
  }

  const { data: created, error: createErr } = await db
    .from('conversations')
    .insert({ type: 'direct', created_by: userId })
    .select('*')
    .maybeSingle();

  if (createErr || !created) {
    return NextResponse.json(
      { error: createErr?.message ?? 'Failed to create conversation' },
      { status: 500 },
    );
  }

  const conv = created as ConversationRow;

  const { error: partErr } = await db
    .from('conversation_participants')
    .insert([
      { conversation_id: conv.id, user_id: userId },
      { conversation_id: conv.id, user_id: participantId },
    ]);

  if (partErr) {
    return NextResponse.json({ error: partErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: conv.id,
      type: conv.type,
      name: conv.name,
      avatar: conv.avatar,
      participantIds: [userId, participantId],
      lastMessage: null,
      unreadCount: 0,
      lastReadAt: null,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      isEncrypted: false,
      encryptionEnabledAt: null,
    },
  });
}
