import 'server-only';
import { getServerClient } from '@/utils/supabase/server';

type AttachmentType = 'audio' | 'file';
type Denial = { status: number; error: string };

/** Only the uploader may introduce a new R2 key into a chat message. */
export function hasAllowedChatAttachmentKey(media: unknown, senderId: string): boolean {
  if (!media || typeof media !== 'object' || !('r2_key' in media)) return true;
  const value = media as { type?: unknown; r2_key?: unknown };
  if (typeof value.r2_key !== 'string') return false;
  return value.type === 'audio'
    ? value.r2_key.startsWith(`chat-audio/${senderId}/`)
    : value.type === 'file' && value.r2_key.startsWith(`chat-files/${senderId}/`);
}

/** A valid prefix alone does not prove a chat object belongs to this conversation. */
export async function authorizeChatAttachment(
  conversationId: string,
  r2Key: string,
  type: AttachmentType,
): Promise<Denial | null> {
  if (!conversationId) return { status: 400, error: 'conversationId is required' };
  const prefix = type === 'audio' ? 'chat-audio/' : 'chat-files/';
  if (typeof r2Key !== 'string' || !r2Key.startsWith(prefix)) {
    return { status: 400, error: 'Invalid attachment key' };
  }

  const client = await getServerClient();
  const { data: me } = await client.auth.getUser();
  const viewerId = me?.user?.id;
  if (!viewerId) return { status: 401, error: 'Unauthorized' };

  const [member, attachment] = await Promise.all([
    client.from('conversation_participants').select('conversation_id')
      .eq('conversation_id', conversationId).eq('user_id', viewerId).maybeSingle(),
    client.from('messages').select('id,sender_id')
      .eq('conversation_id', conversationId).eq('is_deleted', false)
      .contains('media', { type, r2_key: r2Key }).limit(1).maybeSingle(),
  ]);
  if (member.error) return { status: 500, error: member.error.message };
  if (!member.data) return { status: 403, error: 'Not a participant in this conversation' };
  if (attachment.error) return { status: 500, error: attachment.error.message };
  if (!attachment.data) return { status: 404, error: 'Attachment not found' };
  // Older keys were not uploader-scoped. For new keys, enforce ownership here
  // too: direct Supabase inserts must not bypass the message route's check.
  const isLegacyKey = new RegExp(`^${prefix}\\d{4}/`).test(r2Key);
  if (!isLegacyKey && !r2Key.startsWith(`${prefix}${attachment.data.sender_id}/`)) {
    return { status: 403, error: 'Attachment owner mismatch' };
  }
  return null;
}
