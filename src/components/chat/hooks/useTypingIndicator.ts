import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { subscribeToBroadcast, publishBroadcast, unsubscribe } from '@/utils/supabase/realtime';

interface UseTypingIndicatorProps {
  conversationId: string | null;
}

interface TypingPayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

function channelForTyping(conversationId: string): string {
  return `chat:typing:${conversationId}`;
}

export function useTypingIndicator({ conversationId }: UseTypingIndicatorProps) {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!conversationId) return;
    const channelName = channelForTyping(conversationId);

    const channel = subscribeToBroadcast<TypingPayload>({
      channel: channelName,
      event: 'user.typing',
      onMessage: (payload) => {
        if (payload.conversationId !== conversationId) return;
        if (!payload.userId || payload.userId === user?.id) return;

        setIsTyping(Boolean(payload.isTyping));
        if (payload.isTyping) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
      },
    });

    return () => {
      unsubscribe(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, user?.id]);

  const publishTyping = useCallback(
    (isTypingValue: boolean) => {
      if (!conversationId || !user?.id) return;
      void publishBroadcast<TypingPayload>(
        channelForTyping(conversationId),
        'user.typing',
        {
          conversationId,
          userId: user.id,
          isTyping: isTypingValue,
        },
      );
    },
    [conversationId, user?.id],
  );

  const startTyping = useCallback(() => publishTyping(true), [publishTyping]);
  const stopTyping = useCallback(() => publishTyping(false), [publishTyping]);

  const handleInputChange = useCallback(
    (value: string, prevValue: string) => {
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
    },
    [conversationId, startTyping, stopTyping],
  );

  return {
    isTyping,
    startTyping,
    stopTyping,
    handleInputChange,
  };
}
