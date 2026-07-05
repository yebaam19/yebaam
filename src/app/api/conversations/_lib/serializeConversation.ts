import { resolvePeerDisplay, type PeerProfileRow } from '@/features/chat/lib/resolvePeerDisplay';
import { groupAutoName } from '@/features/chat/lib/groupName';
import { imageUrl } from '@/lib/media/urls';
import { chatCryptoReady } from '@/lib/server/chat-crypto';
import type { ConversationRow, MessageRow, ParticipantRow } from './conversations.types';

/**
 * POST serializer — collapses the two identical "direct conversation" response
 * objects (the "existing" and "newly created" branches). Hardcodes the
 * direct-create defaults (no last message, zero unread) and falls back to the
 * peer's display name/avatar when the row's own are NULL.
 */
export function serializeDirectConversation(args: {
  existing: { name: string | null; avatar: string | null };
  peer: { name: string; avatar: string | null };
  id: string;
  type: string;
  userId: string;
  participantId: string;
  createdAt: string;
  updatedAt: string;
}) {
  const { existing, peer, id, type, userId, participantId, createdAt, updatedAt } = args;
  return {
    id,
    type,
    name: existing.name ?? peer.name,
    avatar: existing.avatar ?? peer.avatar,
    participantIds: [userId, participantId],
    lastMessage: null,
    unreadCount: 0,
    lastReadAt: null,
    createdAt,
    updatedAt,
    // Encryption is a platform policy, not a per-conversation toggle: every
    // private conversation is encrypted at rest once the key is configured.
    isEncrypted: chatCryptoReady(),
    encryptionEnabledAt: null,
  };
}

/**
 * GET serializer — metadata-aware row mapper. Mirrors the `.map()` body of the
 * conversation-list assembly: resolves DIRECT peer name/avatar, builds a
 * per-viewer GROUP auto-name, and derives `isEncrypted`/`encryptionEnabledAt`
 * from the conversation metadata.
 */
export function serializeConversationRow(args: {
  c: ConversationRow;
  partsByConv: Map<string, ParticipantRow[]>;
  lastMsgByConv: Map<string, MessageRow>;
  mine: Map<string, ParticipantRow>;
  peerByConv: Map<string, string>;
  groupOthersByConv: Map<string, string[]>;
  profileById: Map<string, PeerProfileRow>;
}) {
  const { c, partsByConv, lastMsgByConv, mine, peerByConv, groupOthersByConv, profileById } =
    args;
  const participants = partsByConv.get(c.id) ?? [];
  const last = lastMsgByConv.get(c.id) ?? null;
  const myPart = mine.get(c.id);
  const meta = c.metadata ?? {};

  let name = c.name;
  let avatar = c.avatar;
  if (c.type === 'direct') {
    const peerId = peerByConv.get(c.id);
    if (peerId) {
      const display = resolvePeerDisplay(profileById.get(peerId) ?? null, peerId);
      name = name ?? display.name;
      avatar = avatar ?? display.avatar;
    }
  } else {
    // GROUP: resolve the Cloudflare photo (we store only the id), and build a
    // per-viewer display name from the other members when unnamed.
    const cfImageId = (meta as { avatar_cf_image_id?: string }).avatar_cf_image_id;
    avatar = avatar ?? (cfImageId ? imageUrl(cfImageId) : null);
    if (!name) {
      const others = groupOthersByConv.get(c.id) ?? [];
      name = groupAutoName(others.map((id) => profileById.get(id)?.first_name ?? ''));
    }
  }

  return {
    id: c.id,
    type: c.type,
    name,
    avatar,
    clubId: c.club_id ?? null,
    participantIds: participants.map((p) => p.user_id),
    lastMessage: last
      ? {
          id: last.id,
          content: last.content,
          senderId: last.sender_id,
          createdAt: last.created_at,
          media: last.media ?? null,
        }
      : null,
    unreadCount: 0,
    lastReadAt: myPart?.last_read_at ?? null,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    metadata: meta,
    // Policy-derived: private conversations (everything except club public
    // chats) are encrypted at rest; club chats stay server-readable.
    isEncrypted: !c.club_id && chatCryptoReady(),
    encryptionEnabledAt: (meta as { encryption_enabled_at?: string }).encryption_enabled_at ?? null,
  };
}
