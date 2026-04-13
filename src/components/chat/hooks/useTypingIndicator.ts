import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { insforge } from '@/lib/insforge/client';

interface UseTypingIndicatorProps {
  conversationId: string | null;
}

function channelForConversation(conversationId: string): string {
  return `chat:conv:${conversationId}`;
}

export function useTypingIndicator({ conversationId }: UseTypingIndicatorProps) {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!conversationId) return;
    const myChannel = channelForConversation(conversationId);

    const handleUserTyping = (payload: any) => {
      const channel = payload?.meta?.channel ?? '';
      if (channel && channel !== myChannel) return;
      if (payload?.conversationId && payload.conversationId !== conversationId) return;
      if (!payload?.userId || payload.userId === user?.id) return;

      setIsTyping(Boolean(payload.isTyping));

      if (payload.isTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    insforge.realtime.on('user.typing', handleUserTyping);
    return () => {
      insforge.realtime.off('user.typing', handleUserTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, user?.id]);

  const publishTyping = (isTypingValue: boolean) => {
    if (!conversationId || !user?.id) return;
    insforge.realtime
      .publish(channelForConversation(conversationId), 'user.typing', {
        conversationId,
        userId: user.id,
        isTyping: isTypingValue,
      })
      .catch(() => {});
  };

  const startTyping = () => publishTyping(true);
  const stopTyping = () => publishTyping(false);

  const handleInputChange = (value: string, prevValue: string) => {
    if (!conversationId) return;

    if (value.length === 1 && prevValue.length === 0) {
      startTyping();
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => stopTyping(), 2000);
    } else {
      stopTyping();
    }
  };

  return {
    isTyping,
    startTyping,
    stopTyping,
    handleInputChange,
  };
}
