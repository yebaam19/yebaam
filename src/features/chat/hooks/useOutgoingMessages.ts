import { useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { enqueueMessage, useOutgoingMessagesStore } from '../store/outgoing-messages.store';
import { mergeMessages } from '../lib/messageRows';
import type { ChatMessage, MessageMedia } from '../types';

export function useOutgoingMessages(conversationId: string | null, received: ChatMessage[], setReceived?: Dispatch<SetStateAction<ChatMessage[]>>) {
  const userId = useAuthStore((state) => state.user?.id);
  const outgoing = useOutgoingMessagesStore((state) => state.messages);
  useEffect(() => {
    const delivered = outgoing.filter((message) => message.conversationId === conversationId &&
      message.senderId === userId && !message.isTemporary);
    if (setReceived && delivered.some((message) => !received.some((item) => item.id === message.id))) {
      setReceived((previous) => mergeMessages(previous, delivered));
    }
  }, [outgoing, received, setReceived, conversationId, userId]);
  useEffect(() => {
    const confirmed = new Set(received.filter((message) => !message.isTemporary).map((message) => message.id));
    if (outgoing.some((message) => confirmed.has(message.id))) {
      useOutgoingMessagesStore.setState((state) => ({
        messages: state.messages.filter((message) => !confirmed.has(message.id)),
      }));
    }
  }, [received, outgoing]);
  const messages = useMemo(() => mergeMessages(
    received.filter((message) => message.conversationId === conversationId),
    outgoing.filter((message) => message.conversationId === conversationId && message.senderId === userId),
  ), [conversationId, received, outgoing, userId]);
  const sendMessage = async (content?: string, media?: MessageMedia) => enqueueMessage(conversationId, content, media);
  return { messages, sendMessage };
}
