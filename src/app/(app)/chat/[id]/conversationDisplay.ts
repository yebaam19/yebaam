import { supabase } from '@/utils/supabase/client';
import { ConversationType, type Conversation } from '@/features/chat/types';
import { resolvePeerDisplay, type PeerProfileRow } from '@/features/chat/lib/resolvePeerDisplay';
import { fetchGroupParticipants, type GroupParticipant } from '@/features/chat/lib/groupParticipants';
import { imageUrl } from '@/lib/media/urls';

export type ParticipantDisplay = GroupParticipant;

export interface ConversationDisplay {
  name: string;
  avatar: string;
  isOnline: boolean;
  isEncrypted: boolean;
  /** Peer user id for 1:1 chats (enables anonymous-chat menu); null for groups. */
  peerUserId: string | null;
  isGroup: boolean;
  /** All members with resolved name/avatar — used to label group message bubbles. */
  participants: ParticipantDisplay[];
}

/**
 * Resolve the header + per-sender display for a conversation, branching on
 * participant count. For 1:1 it mirrors the long-standing peer-profile fallback
 * chain; for groups (>2) it builds a per-viewer name (excludes you, never goes
 * stale) and the participant→profile map the message list needs to label
 * incoming bubbles. Group photo is stored as a Cloudflare id in metadata and
 * resolved to a URL here.
 */
export async function loadConversationDisplay(
  resolvedConversationId: string,
  meId: string,
  conversationSnapshot: Conversation | null,
): Promise<ConversationDisplay> {
  const { data: partRows, error: partErr } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', resolvedConversationId);

  const participantIds = ((partRows ?? []) as { user_id: string }[])
    .map((r) => r.user_id)
    .filter(Boolean);

  if (partErr) {
    console.warn('[conversationDisplay] conversation_participants:', partErr.message);
  }

  const isGroup =
    participantIds.length > 2 || conversationSnapshot?.type === ConversationType.GROUP;

  if (isGroup && participantIds.length > 0) {
    const { data: crow } = await supabase
      .from('conversations')
      .select('name, avatar, metadata')
      .eq('id', resolvedConversationId)
      .maybeSingle();
    const row = crow as
      | { name: string | null; avatar: string | null; metadata: Record<string, unknown> | null }
      | null;

    const { participants, autoName } = await fetchGroupParticipants(
      resolvedConversationId,
      meId,
      participantIds,
    );
    const cfImageId = (row?.metadata as { avatar_cf_image_id?: string } | null)?.avatar_cf_image_id;

    return {
      name: row?.name?.trim() || conversationSnapshot?.name?.trim() || autoName,
      avatar: row?.avatar || (cfImageId ? imageUrl(cfImageId) : '') || conversationSnapshot?.avatar || '',
      isOnline: false,
      isEncrypted: Boolean(conversationSnapshot?.isEncrypted),
      peerUserId: null,
      isGroup: true,
      participants,
    };
  }

  // 1:1 — resolve the peer's profile.
  let peerUserId: string | null = null;
  if (conversationSnapshot?.type === ConversationType.DIRECT && conversationSnapshot.participantIds.length >= 2) {
    peerUserId = conversationSnapshot.participantIds.find((id) => id !== meId) ?? null;
  }
  if (!peerUserId && participantIds.length === 2) {
    peerUserId = participantIds.find((id) => id !== meId) ?? null;
  }
  if (!peerUserId && participantIds.length === 1 && participantIds[0] !== meId) {
    peerUserId = participantIds[0] ?? null;
  }

  const fallback: ConversationDisplay = {
    name: conversationSnapshot?.name?.trim() || 'Chat',
    avatar: conversationSnapshot?.avatar ?? '',
    isOnline: false,
    isEncrypted: Boolean(conversationSnapshot?.isEncrypted),
    peerUserId,
    isGroup: false,
    participants: [],
  };

  if (!peerUserId) return fallback;

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url')
    .eq('id', peerUserId)
    .maybeSingle();

  if (profErr || !profile) {
    return { ...fallback, name: peerUserId.slice(0, 8), avatar: '' };
  }

  const display = resolvePeerDisplay(profile as PeerProfileRow, peerUserId);
  return { ...fallback, name: display.name, avatar: display.avatar ?? '' };
}
