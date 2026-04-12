'use client';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { useMessengerChat } from './hooks/useMessengerChat';
import ChatHeader from './ChatHeader';
import MessagesList from './MessagesList';
import ChatInput from './ChatInput';
import EmptyChatState from './EmptyChatState';

interface ActiveChat {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

interface MessengerChatViewProps {
  activeChat: ActiveChat | null;
  onClose: () => void;
  contactId: string;
  contactName: string;
  contactAvatar: string;
  isOnline: boolean;
  position?: number;
}

export default function MessengerChatView({ 
  activeChat,
  contactId = '',
  contactName = '',
  contactAvatar = '',
  isOnline = false,
  position = 0,
}: MessengerChatViewProps) {
  const user = useAuthStore((state) => state.user);

  const {
    conversationId,
    conversation,
    messages,
    isLoading,
    isTyping,
    sendMessage,
    emitTypingStart,
    emitTypingStop,
    typingTimeoutRef,
    refreshConversation, // Agregar función de refresh
  } = useMessengerChat({ contactId, activeChat });

  if (!activeChat) {
    return <EmptyChatState />;
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-neutral-900">
      <ChatHeader
        contactName={contactName}
        contactAvatar={contactAvatar}
        isOnline={isOnline}
        conversationId={conversationId || undefined}
        isEncrypted={conversation?.isEncrypted || false}
        onRefreshConversation={refreshConversation}
      />

      <MessagesList
        messages={messages}
        isLoading={isLoading}
        isTyping={isTyping}
        currentUserId={user?.id}
        contactAvatar={contactAvatar}
        contactName={contactName}
      />

      <ChatInput
        onSendMessage={sendMessage}
        onTypingStart={emitTypingStart}
        onTypingStop={emitTypingStop}
        typingTimeoutRef={typingTimeoutRef}
      />
    </div>
  );
}
