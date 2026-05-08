import { ConversationType, type Conversation } from '../types';

export function chatHrefForConversation(conv: Conversation, userId: string): string {
  if (conv.type === ConversationType.DIRECT && conv.participantIds.length >= 2) {
    const other = conv.participantIds.find((id) => id !== userId);
    if (other) return `/chat/${other}`;
  }
  return `/chat/${conv.id}`;
}
