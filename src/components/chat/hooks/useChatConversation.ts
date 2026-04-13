import { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import { useChatNotifications } from '@/features/chat/context/chat-notification.context';
import { insforge } from '@/lib/insforge/client';

interface UseChatConversationProps {
  contactId: string;
}

function channelForConversation(conversationId: string): string {
  return `chat:conv:${conversationId}`;
}

export function useChatConversation({ contactId }: UseChatConversationProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const user = useAuthStore((state) => state.user);
  const { markConversationAsOpen, markConversationAsClosed } = useChatNotifications();

  useEffect(() => {
    let isMounted = true;

    const initializeConversation = async () => {
      try {
        setIsLoading(true);

        let conversation = await chatService.findConversationByParticipant(contactId);
        if (!conversation) {
          conversation = await chatService.createOrGetConversation(contactId);
        }

        if (!isMounted) return;

        setConversationId(conversation.id);
        markConversationAsOpen(conversation.id);

        const result = await chatService.getConversationMessages(conversation.id, 50, 0);
        if (!isMounted) return;

        const sortedMessages = result.messages.sort((a: any, b: any) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        setMessages(sortedMessages);

        // Join InsForge realtime channel for this conversation
        try {
          await insforge.realtime.connect();
          await insforge.realtime.subscribe(channelForConversation(conversation.id));
        } catch (err) {
          console.warn('[useChatConversation] realtime subscribe failed', err);
        }

        // Mark unread inbound messages as read
        const hasUnread = sortedMessages.some(
          (msg: any) => msg.senderId !== user?.id && msg.status !== 'read',
        );
        if (hasUnread && user?.id) {
          try {
            await fetch(`/api/conversations/${conversation.id}/read`, {
              method: 'POST',
              credentials: 'same-origin',
            });
            await insforge.realtime.publish(
              channelForConversation(conversation.id),
              'messages.read',
              { conversationId: conversation.id, userId: user.id },
            );
          } catch (err) {
            console.warn('[useChatConversation] mark-as-read failed', err);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('[useChatConversation] init failed', error);
        if (isMounted) setIsLoading(false);
      }
    };

    if (contactId && !conversationId && user?.id) {
      initializeConversation();
    }

    return () => {
      isMounted = false;
      if (conversationId) {
        try {
          insforge.realtime.unsubscribe(channelForConversation(conversationId));
        } catch {}
        markConversationAsClosed(conversationId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, user?.id]);

  return {
    conversationId,
    messages,
    setMessages,
    isLoading,
  };
}
