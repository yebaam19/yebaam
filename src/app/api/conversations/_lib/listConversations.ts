import { getServerClient } from '@/utils/supabase/server';
import { withRetry } from '@/utils/supabase/with-retry';
import { type PeerProfileRow } from '@/features/chat/lib/resolvePeerDisplay';
import type { ConversationRow, MessageRow, ParticipantRow } from './conversations.types';
import { serializeConversationRow } from './serializeConversation';

type Client = Awaited<ReturnType<typeof getServerClient>>;

export type ConversationListItem = ReturnType<typeof serializeConversationRow>;

export type LoadConversationListResult =
  | { ok: true; data: ConversationListItem[] }
  | { ok: false; error: string };

export async function loadConversationList(
  client: Client,
  userId: string,
): Promise<LoadConversationListResult> {
  const { data: myParts, error: partsErr } = await withRetry(() =>
    client
      .from('conversation_participants')
      .select('conversation_id,last_read_at')
      .eq('user_id', userId),
  );

  if (partsErr) {
    return { ok: false, error: partsErr.message };
  }

  const conversationIds = (myParts ?? []).map((p: Partial<ParticipantRow>) => p.conversation_id).filter(Boolean) as string[];
  if (conversationIds.length === 0) {
    return { ok: true, data: [] };
  }

  const { data: convs, error: convErr } = await withRetry(() =>
    client
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false }),
  );

  if (convErr) {
    return { ok: false, error: convErr.message };
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
          .select('id,conversation_id,sender_id,content,media,created_at')
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

  // For DIRECT chats, `conversations.name`/`avatar` are NULL — populate them
  // from the peer's profile so consumers (header dropdown, etc.) can render
  // the row without re-fetching. For auto-named GROUP chats we likewise need
  // the other members' first names to build the per-viewer display name.
  const peerByConv = new Map<string, string>();
  const peerIds = new Set<string>();
  // Group conv id -> ordered list of the *other* members' user ids.
  const groupOthersByConv = new Map<string, string[]>();
  for (const c of (convs ?? []) as ConversationRow[]) {
    if (c.type === 'direct') {
      const peer = (partsByConv.get(c.id) ?? []).find((p) => p.user_id !== userId);
      if (peer) {
        peerByConv.set(c.id, peer.user_id);
        peerIds.add(peer.user_id);
      }
      continue;
    }
    // Group: only fetch member names when we'll need to auto-name it.
    if (!c.name) {
      const others = (partsByConv.get(c.id) ?? [])
        .map((p) => p.user_id)
        .filter((id) => id !== userId);
      groupOthersByConv.set(c.id, others);
      for (const id of others) peerIds.add(id);
    }
  }

  const profileById = new Map<string, PeerProfileRow>();
  if (peerIds.size > 0) {
    const { data: profiles } = await withRetry(() =>
      client
        .from('profiles')
        .select('id,username,first_name,last_name,avatar_url')
        .in('id', Array.from(peerIds)),
    );
    for (const p of (profiles ?? []) as PeerProfileRow[]) {
      profileById.set(p.id, p);
    }
  }

  const result = ((convs ?? []) as ConversationRow[]).map((c) =>
    serializeConversationRow({
      c,
      userId,
      partsByConv,
      lastMsgByConv,
      mine,
      peerByConv,
      groupOthersByConv,
      profileById,
    }),
  );

  return { ok: true, data: result };
}
