import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import type { ChatMessage } from '@/features/chat/types';
import { useOutgoingMessages } from '@/features/chat/hooks/useOutgoingMessages';

export function useChatMessages({ conversationId, messages: received, setMessages }: {
  conversationId: string | null;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
}) {
  const { messages, sendMessage } = useOutgoingMessages(conversationId, received, setMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [lastId]);
  return { messages, sendMessage, messagesEndRef };
}
