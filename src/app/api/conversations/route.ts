import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient, getServerAccessToken, getServiceClient } from '@/utils/supabase/server';
import { resolvePeerDisplay, type PeerProfileRow } from '@/features/chat/lib/resolvePeerDisplay';
import { getUserIdFromSession } from './_lib/session';
import { loadConversationList } from './_lib/listConversations';
import { serializeDirectConversation } from './_lib/serializeConversation';
import type { ConversationRow } from './_lib/conversations.types';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { isUuid } from '@/lib/supabase-filter';

/** New-DM ceiling per user: plenty for a human, short of a spam fan-out loop. */
const CREATE_CONVERSATION_LIMIT = { limit: 30, windowMs: 60 * 60 * 1000 };

export async function GET() {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ success: true, data: [], count: 0 });

  const client = await getServerClient();
  const userId = await getUserIdFromSession();
  if (!userId) return NextResponse.json({ success: true, data: [], count: 0 });

  try {
    const result = await loadConversationList(client, userId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data, count: result.data.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load conversations' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const token = await getServerAccessToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Everything below runs on the service client, so validate + throttle here.
  const rate = checkRateLimit(`conversations:create:${userId}`, CREATE_CONVERSATION_LIMIT);
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.resetAt - Date.now()) / 1000)) } },
    );
  }

  const { participantId } = (await request.json().catch(() => ({}))) as {
    participantId?: unknown;
  };
  if (!participantId) {
    return NextResponse.json({ error: 'participantId is required' }, { status: 400 });
  }
  if (!isUuid(participantId)) {
    return NextResponse.json({ error: 'participantId must be a UUID' }, { status: 400 });
  }
  if (participantId === userId) {
    return NextResponse.json({ error: 'Cannot start a conversation with yourself' }, { status: 400 });
  }

  const db = getServiceClient();

  // Peer profile for DIRECT name/avatar enrichment — fetched once and reused
  // by both the "existing" and "newly created" branches below. Also the
  // existence check: no profile → no conversation.
  // TODO(product): gate on friendship or DM setting
  const { data: peerProfile } = await db
    .from('profiles')
    .select('id,username,first_name,last_name,avatar_url')
    .eq('id', participantId)
    .maybeSingle();
  if (!peerProfile) {
    return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
  }
  const peerDisplay = resolvePeerDisplay(peerProfile as PeerProfileRow, participantId);

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
          data: serializeDirectConversation({
            existing,
            peer: peerDisplay,
            id: existing.id,
            type: existing.type,
            userId,
            participantId,
            createdAt: existing.created_at,
            updatedAt: existing.updated_at,
          }),
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
    data: serializeDirectConversation({
      existing: conv,
      peer: peerDisplay,
      id: conv.id,
      type: conv.type,
      userId,
      participantId,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
    }),
  });
}
