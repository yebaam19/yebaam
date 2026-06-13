'use client';

import { useTranslations } from 'next-intl';

import ChatHeader from '@/components/chat/ChatHeader';
import MessagesList from '@/components/chat/MessagesList';
import ChatInput from '@/components/chat/ChatInput';
import type { MessageMedia } from '@/features/chat/types';
import type { ParticipantDisplay } from '@/features/chat/lib/conversationDisplay';

interface ContactInfo {
  name: string;
  avatar: string;
  isOnline: boolean;
}

interface ConversationPaneProps {
  contactInfo: ContactInfo;
  conversationId: string | null;
  peerUserId: string | null;
  isGroup: boolean;
  headerEncrypted: boolean;
  messages: any[];
  isLoading: boolean;
  currentUserId?: string;
  participants: ParticipantDisplay[];
  onOpenInboxDrawer: () => void;
  onClose: () => void;
  onSendMessage: (content?: string, media?: MessageMedia) => Promise<boolean>;
  onEditMessage: (messageId: string, content: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

const noop = () => {};

export default function ConversationPane({
  contactInfo,
  conversationId,
  peerUserId,
  isGroup,
  headerEncrypted,
  messages,
  isLoading,
  currentUserId,
  participants,
  onOpenInboxDrawer,
  onClose,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
}: ConversationPaneProps) {
  const t = useTranslations('chat');

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-neutral-200 bg-white md:border-l dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-neutral-200 px-2 dark:border-neutral-800 md:hidden">
        <button
          type="button"
          onClick={onOpenInboxDrawer}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-primary-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          {t('conversation.conversationsButton')}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatHeader
          contactName={contactInfo.name}
          contactAvatar={contactInfo.avatar}
          isOnline={contactInfo.isOnline}
          conversationId={conversationId ?? undefined}
          peerUserId={peerUserId ?? undefined}
          isGroup={isGroup}
          isEncrypted={headerEncrypted}
          onClose={onClose}
        />

        <MessagesList
          messages={messages}
          isLoading={isLoading}
          isTyping={false}
          currentUserId={currentUserId}
          contactAvatar={contactInfo.avatar}
          contactName={contactInfo.name}
          isGroup={isGroup}
          participants={participants}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
        />

        <ChatInput
          onSendMessage={onSendMessage}
          onTypingStart={noop}
          onTypingStop={noop}
          typingTimeoutRef={{ current: null }}
        />
      </div>
    </div>
  );
}
