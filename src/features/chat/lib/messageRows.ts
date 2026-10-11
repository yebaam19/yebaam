import { MessageStatus, type Message, type ChatMessage } from '../types';

export type DbMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media: unknown;
  status: string;
  reply_to_id: string | null;
  is_deleted: boolean;
  edited_at?: string | null;
  created_at: string;
  updated_at: string;
};

export function rowToMessage(row: DbMessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    media: (row.media ?? null) as Message['media'],
    status: (row.status as MessageStatus) ?? MessageStatus.SENT,
    replyToId: row.reply_to_id,
    isDeleted: Boolean(row.is_deleted),
    editedAt: row.edited_at ?? null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at ?? row.created_at),
  };
}

const byCreatedAt = (a: ChatMessage, b: ChatMessage) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

/** Merge history with messages received during the request. */
export function mergeMessages(previous: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const merged = new Map(previous.map((message) => [message.id, message]));
  for (const message of incoming) {
    if (!merged.has(message.id)) merged.set(message.id, message);
  }
  return [...merged.values()].sort(byCreatedAt);
}
