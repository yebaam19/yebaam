'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { insforge } from '@/lib/insforge/client';
import { usePresenceStore } from '@/features/presence/store/presence.store';
import { useChatConversation } from './hooks/useChatConversation';
import { useChatMessages } from './hooks/useChatMessages';
import { useTypingIndicator } from './hooks/useTypingIndicator';
import { ChatBubbleHeader } from './ChatBubble/ChatBubbleHeader';
import { ChatBubbleMessages } from './ChatBubble/ChatBubbleMessages';
import { ChatBubbleInput } from './ChatBubble/ChatBubbleInput';

interface ChatBubbleProps {
  contactId: string;
  contactName: string;
  contactAvatar: string;
  isOnline: boolean;
  onClose: () => void;
  position: number;
}

export default function ChatBubble({
  contactId,
  contactName,
  contactAvatar,
  isOnline: initialIsOnline,
  onClose,
  position = 0,
}: ChatBubbleProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isChatConnected, setIsChatConnected] = useState(false);

  const isOnline = usePresenceStore((state) => state.isUserOnline(contactId));

  // Track the InsForge realtime connection state so the header dot reflects it.
  useEffect(() => {
    let cancelled = false;
    const handleConnect = () => !cancelled && setIsChatConnected(true);
    const handleDisconnect = () => !cancelled && setIsChatConnected(false);

    insforge.realtime.on('connect', handleConnect);
    insforge.realtime.on('disconnect', handleDisconnect);

    insforge.realtime
      .connect()
      .then(() => !cancelled && setIsChatConnected(true))
      .catch(() => !cancelled && setIsChatConnected(false));

    return () => {
      cancelled = true;
      insforge.realtime.off('connect', handleConnect);
      insforge.realtime.off('disconnect', handleDisconnect);
    };
  }, []);

  const { conversationId, messages, setMessages, isLoading } = useChatConversation({
    contactId,
  });

  const { sendMessage, messagesEndRef } = useChatMessages({
    conversationId,
    messages,
    setMessages,
  });

  const { isTyping, stopTyping, handleInputChange } = useTypingIndicator({
    conversationId,
  });

  const rightPosition = 320 + position * 340;

  return (
    <div
      className={cn(
        'fixed bottom-0 w-80 bg-white dark:bg-neutral-900 rounded-t-xl shadow-2xl border-x border-t border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-200 z-40',
        isMinimized ? 'h-14' : 'h-[480px]',
      )}
      style={{ right: `${rightPosition}px` }}
    >
      <ChatBubbleHeader
        contactName={contactName}
        contactAvatar={contactAvatar}
        isOnline={isOnline || initialIsOnline}
        isChatConnected={isChatConnected}
        isMinimized={isMinimized}
        onToggleMinimize={() => setIsMinimized(!isMinimized)}
        onClose={onClose}
      />

      {!isMinimized && (
        <>
          <ChatBubbleMessages
            messages={messages}
            isLoading={isLoading}
            isTyping={isTyping}
            messagesEndRef={messagesEndRef}
          />

          <ChatBubbleInput
            onSendMessage={sendMessage}
            onTypingChange={handleInputChange}
            onStopTyping={stopTyping}
          />
        </>
      )}
    </div>
  );
}
