'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChatBubble } from './hooks/useChatBubble';
import ChatBubbleHeader from './ChatBubbleHeader';
import ChatBubbleMessages from './ChatBubbleMessages';
import ChatBubbleInput from './ChatBubbleInput';

interface ChatBubbleRealTimeProps {
  contactId: string;
  contactName: string;
  contactAvatar: string;
  isOnline: boolean;
  onClose: () => void;
  position: number; // Para posicionar múltiples chats
}

export default function ChatBubbleRealTime({
  contactId,
  contactName,
  contactAvatar,
  isOnline,
  onClose,
  position = 0,
}: ChatBubbleRealTimeProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const user = useAuthStore((state) => state.user);

  const {
    conversationId,
    messages,
    isLoadingConversation,
    isConnected,
    sendMessage,
    closeConversation,
  } = useChatBubble({ contactId });

  const handleClose = () => {
    closeConversation();
    onClose();
  };

  // Calcular posición desde la derecha
  const rightPosition = 320 + (position * 340);

  return (
    <div
      className={cn(
        "fixed bottom-0 w-80 bg-white dark:bg-neutral-900 rounded-t-xl shadow-2xl border-x border-t border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-200 z-40",
        isMinimized ? "h-14" : "h-[480px]"
      )}
      style={{ right: `${rightPosition}px` }}
    >
      <ChatBubbleHeader
        contactName={contactName}
        contactAvatar={contactAvatar}
        isOnline={isOnline}
        isConnected={isConnected}
        isMinimized={isMinimized}
        onToggleMinimize={() => setIsMinimized(!isMinimized)}
        onClose={handleClose}
      />

      {!isMinimized && (
        <>
          <ChatBubbleMessages
            messages={messages}
            isLoadingConversation={isLoadingConversation}
            currentUserId={user?.id}
          />

          <ChatBubbleInput
            onSendMessage={sendMessage}
            conversationId={conversationId}
            isLoadingConversation={isLoadingConversation}
          />
        </>
      )}
    </div>
  );
}
