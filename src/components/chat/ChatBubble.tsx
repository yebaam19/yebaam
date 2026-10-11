'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { usePresenceStore } from '@/features/presence/store/presence.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import { fetchGroupParticipants, type GroupParticipant } from '@/features/chat/lib/groupParticipants';
import { useChatConversation } from './hooks/useChatConversation';
import { useChatMessages } from './hooks/useChatMessages';
import { useTypingIndicator } from './hooks/useTypingIndicator';
import { ChatBubbleHeader } from './ChatBubble/ChatBubbleHeader';
import { ChatBubbleMessages } from './ChatBubble/ChatBubbleMessages';
import { ChatBubbleInput } from './ChatBubble/ChatBubbleInput';
import NewMessageDialog from './NewMessageDialog';

interface ChatBubbleProps {
  contactId: string;
  contactName: string;
  contactAvatar: string;
  isOnline: boolean;
  onClose: () => void;
  position: number;
  baseOffset?: number;
  openRequest?: number;
  /** For group bubbles: the conversation id + group flag (no single peer to resolve). */
  conversationId?: string;
  isGroup?: boolean;
}

export default function ChatBubble({
  contactId,
  contactName,
  contactAvatar,
  isOnline: initialIsOnline,
  onClose,
  position = 0,
  baseOffset = 320,
  openRequest = 0,
  conversationId: groupConversationId,
  isGroup = false,
}: ChatBubbleProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastOpenRequest, setLastOpenRequest] = useState(openRequest);
  if (lastOpenRequest !== openRequest) {
    setLastOpenRequest(openRequest);
    setIsMinimized(false);
  }
  const [groupComposerOpen, setGroupComposerOpen] = useState(false);
  const meId = useAuthStore((state) => state.user?.id);
  const [participants, setParticipants] = useState<GroupParticipant[]>([]);
  // Supabase channels connect lazily per subscription and stay up as long
  // as any channel is active. Treat the bubble as connected for UI purposes;
  // if a channel fails, useChatConversation will surface that through its
  // own loading state rather than a global connection dot.
  const isChatConnected = true;

  const isOnline = usePresenceStore((state) => state.isUserOnline(contactId));

  const { conversationId, messages, setMessages, isLoading } = useChatConversation({
    contactId,
    conversationId: groupConversationId,
  });

  // Group bubbles: resolve member name/avatar so incoming messages can be labelled.
  useEffect(() => {
    if (!isGroup || !conversationId || !meId) return;
    let active = true;
    fetchGroupParticipants(conversationId, meId)
      .then(({ participants: p }) => {
        if (active) setParticipants(p);
      })
      .catch((err) => console.warn('[ChatBubble] participants load failed', err));
    return () => {
      active = false;
    };
  }, [isGroup, conversationId, meId]);

  const { messages: visibleMessages, sendMessage, messagesEndRef } = useChatMessages({
    conversationId,
    messages,
    setMessages,
  });

  const { isTyping, stopTyping, handleInputChange } = useTypingIndicator({
    conversationId,
  });

  const tMsg = useTranslations('chat.message');

  // Edit / delete own messages (optimistic; Realtime UPDATE syncs the peers).
  const handleEditMessage = async (messageId: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed || !conversationId) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, content: trimmed, editedAt: new Date().toISOString() } : m)),
    );
    try {
      await chatService.editMessage(conversationId, messageId, trimmed);
    } catch {
      toast.error(tMsg('editFailed'));
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!conversationId) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true, content: '', media: null } : m)),
    );
    try {
      await chatService.deleteMessage(conversationId, messageId);
    } catch {
      toast.error(tMsg('deleteFailed'));
    }
  };

  const bubbleWidthPx = 328;
  /** ~12px gutter between stacked docked chats (same footprint as antes con w-80). */
  const stackStepPx = bubbleWidthPx + 12;
  const rightPosition = baseOffset + position * stackStepPx;

  return (
    <div
      className={cn(
        'fixed bottom-0 right-2 z-[150] flex w-[min(328px,calc(100vw-16px))] max-h-[calc(100dvh-80px)] xl:right-[var(--chat-compact-right)] 2xl:right-[var(--chat-right)] flex-col rounded-t-xl border border-neutral-200/90 bg-white shadow-[0_12px_28px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.08)] transition-all duration-200 dark:border-neutral-700 dark:bg-neutral-900',
        isMinimized ? 'h-14' : 'h-[480px]',
        position > 0 && 'max-xl:hidden',
      )}
      style={{
        '--chat-right': `${rightPosition}px`,
        '--chat-compact-right': `${16 + position * stackStepPx}px`,
      } as CSSProperties}
    >
      <ChatBubbleHeader
        contactName={contactName}
        contactAvatar={contactAvatar}
        isOnline={!isGroup && (isOnline || initialIsOnline)}
        contactId={isGroup ? undefined : contactId}
        conversationId={isGroup ? undefined : conversationId ?? undefined}
        isChatConnected={isChatConnected}
        isMinimized={isMinimized}
        onToggleMinimize={() => setIsMinimized(!isMinimized)}
        onClose={onClose}
        onCreateGroup={isGroup ? undefined : () => setGroupComposerOpen(true)}
      />

      {!isMinimized && (
        <>
          <ChatBubbleMessages
            messages={visibleMessages}
            isLoading={isLoading}
            isTyping={isTyping}
            messagesEndRef={messagesEndRef}
            contactAvatar={contactAvatar}
            contactName={contactName}
            isGroup={isGroup}
            participants={participants}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
          />

          <ChatBubbleInput
            onSendMessage={sendMessage}
            onTypingChange={handleInputChange}
            onStopTyping={stopTyping}
          />
        </>
      )}

      {!isGroup && (
        <NewMessageDialog
          open={groupComposerOpen}
          onClose={() => setGroupComposerOpen(false)}
          openInBubble
          initialPeer={{ id: contactId, name: contactName, avatar: contactAvatar }}
        />
      )}
    </div>
  );
}
