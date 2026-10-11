import { useEffect, useRef, useState } from 'react';
import { useChatConversation } from './useChatConversation';
import { useTypingIndicator } from './useTypingIndicator';
import { useOutgoingMessages } from '@/features/chat/hooks/useOutgoingMessages';
import { useChatStore } from '@/features/chat/store/chat.store';
import { chatService } from '@/features/chat/services/chat.service';
import type { Conversation } from '@/features/chat/types';

export function useMessengerChat({ contactId, activeChat }: {
  contactId: string; activeChat: { id: string } | null;
}) {
  const { conversationId, messages: received, setMessages, isLoading } = useChatConversation({
    contactId: activeChat ? contactId : '',
  });
  const { messages, sendMessage } = useOutgoingMessages(conversationId, received, setMessages);
  const { isTyping, startTyping, stopTyping } = useTypingIndicator({ conversationId });
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const known = useChatStore((state) => state.conversations.find((item) => item.id === conversationId));
  useEffect(() => {
    if (!contactId || !conversationId) return;
    if (known) return;
    let active = true;
    void chatService.findConversationByParticipant(contactId).then((result) => {
      if (active) setConversation(result);
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [contactId, conversationId, known]);
  const refreshConversation = async () => {
    setConversation(await chatService.findConversationByParticipant(contactId));
  };
  return { conversationId, conversation: known ?? (conversation?.id === conversationId ? conversation : null), messages, isLoading, isTyping, sendMessage,
    emitTypingStart: startTyping, emitTypingStop: stopTyping, typingTimeoutRef, refreshConversation };
}
