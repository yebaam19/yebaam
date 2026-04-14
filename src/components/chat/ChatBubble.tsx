'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
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
  // Supabase channels connect lazily per subscription and stay up as long
  // as any channel is active. Treat the bubble as connected for UI purposes;
  // if a channel fails, useChatConversation will surface that through its
  // own loading state rather than a global connection dot.
  const isChatConnected = true;

  const isOnline = usePresenceStore((state) => state.isUserOnline(contactId));

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
