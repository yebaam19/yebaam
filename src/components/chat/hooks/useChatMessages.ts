import { useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';

interface UseChatMessagesProps {
  conversationId: string | null;
  messages: any[];
  setMessages: Dispatch<SetStateAction<any[]>>;
}

/**
 * Send + auto-scroll helper for an open chat conversation. Realtime inbound
 * messages are handled by useChatConversation — this hook is intentionally
 * narrow so both hooks don't register duplicate postgres_changes listeners
 * against the same filter.
 */
export function useChatMessages({
  conversationId,
  messages,
  setMessages,
}: UseChatMessagesProps) {
  const user = useAuthStore((state) => state.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageContent: string): Promise<boolean> => {
    const trimmed = messageContent.trim();
    if (!trimmed || !conversationId) return false;

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      content: trimmed,
      conversationId,
      senderId: user?.id,
      createdAt: new Date().toISOString(),
      status: 'sending',
      isTemporary: true,
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const newMessage = await chatService.sendMessage(conversationId, trimmed);

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempId);
        if (filtered.some((m) => m.id === newMessage.id)) return filtered;
        return [...filtered, newMessage].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
      return true;
    } catch (error) {
      console.error('[useChatMessages] sendMessage failed:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return false;
    }
  };

  return {
    sendMessage,
    messagesEndRef,
  };
}
