'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useSocket } from '@/providers/socket-provider';
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
  
  // Obtener socket desde el context
  const { chatSocket, isChatConnected } = useSocket();

  // Obtener estado online en tiempo real desde el store
  const isOnline = usePresenceStore(state => state.isUserOnline(contactId));

  // Hook: Manejar conversación y carga inicial
  const { conversationId, messages, setMessages, isLoading } = useChatConversation({
    contactId,
    chatSocket,
  });

  // Hook: Manejar mensajes (enviar, recibir, actualizar)
  const { sendMessage, messagesEndRef } = useChatMessages({
    conversationId,
    chatSocket,
    messages,
    setMessages,
  });

  // Hook: Indicadores de "está escribiendo"
  const { isTyping, stopTyping, handleInputChange } = useTypingIndicator({
    conversationId,
    chatSocket,
  });

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
      {/* Header */}
      <ChatBubbleHeader
        contactName={contactName}
        contactAvatar={contactAvatar}
        isOnline={isOnline}
        isChatConnected={isChatConnected}
        isMinimized={isMinimized}
        onToggleMinimize={() => setIsMinimized(!isMinimized)}
        onClose={onClose}
      />

      {/* Messages & Input Area */}
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
