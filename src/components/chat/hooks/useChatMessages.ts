import { useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import { insforge } from '@/lib/insforge/client';

interface UseChatMessagesProps {
  conversationId: string | null;
  messages: any[];
  setMessages: Dispatch<SetStateAction<any[]>>;
}

function channelForConversation(conversationId: string): string {
  return `chat:conv:${conversationId}`;
}

export function useChatMessages({
  conversationId,
  messages,
  setMessages,
}: UseChatMessagesProps) {
  const user = useAuthStore((state) => state.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for realtime message.created / messages.read events
  useEffect(() => {
    if (!conversationId) return;

    const myChannel = channelForConversation(conversationId);

    const handleMessageCreated = (payload: any) => {
      const channel = payload?.meta?.channel ?? '';
      const eventConvId = payload?.conversationId ?? payload?.message?.conversationId;
      if (channel && channel !== myChannel) return;
      if (eventConvId && eventConvId !== conversationId) return;

      const incoming = payload?.message;
      if (!incoming?.id) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        const next = [...prev, incoming];
        return next.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });

      // Auto-mark as read if the inbound message isn't mine
      if (incoming.senderId && incoming.senderId !== user?.id && user?.id) {
        fetch(`/api/conversations/${conversationId}/read`, {
          method: 'POST',
          credentials: 'same-origin',
        }).catch(() => {});
        insforge.realtime
          .publish(myChannel, 'messages.read', { conversationId, userId: user.id })
          .catch(() => {});
      }
    };

    const handleMessagesRead = (payload: any) => {
      const channel = payload?.meta?.channel ?? '';
      const eventConvId = payload?.conversationId;
      if (channel && channel !== myChannel) return;
      if (eventConvId && eventConvId !== conversationId) return;
      if (payload?.userId && payload.userId === user?.id) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderId === user?.id && msg.status !== 'read' ? { ...msg, status: 'read' } : msg,
        ),
      );
    };

    insforge.realtime.on('message.created', handleMessageCreated);
    insforge.realtime.on('messages.read', handleMessagesRead);

    return () => {
      insforge.realtime.off('message.created', handleMessageCreated);
      insforge.realtime.off('messages.read', handleMessagesRead);
    };
  }, [conversationId, user?.id, setMessages]);

  // Auto-scroll to bottom when new messages arrive
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
