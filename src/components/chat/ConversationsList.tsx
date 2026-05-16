'use client';

import { useTranslations } from 'next-intl';
import ConversationItem from './ConversationItem';
import type { MessageMedia } from '@/features/chat/types';

interface ProcessedConversation {
  id: string;
  otherParticipantId?: string;
  displayName: string;
  displayAvatar: string;
  isOnline: boolean;
  lastMessage?: {
    content: string;
    createdAt: Date;
    media?: MessageMedia | null;
  } | null;
  formattedTimestamp: string;
  unreadCount: number;
}

interface ActiveChat {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

interface ConversationsListProps {
  conversations: ProcessedConversation[];
  activeChat: ActiveChat | null;
  /** When set (full-page messenger), highlights by conversation row id. */
  highlightConversationId?: string | null;
  searchQuery: string;
  onSelectChat: (chat: ActiveChat) => void;
}

export default function ConversationsList({
  conversations,
  activeChat,
  highlightConversationId,
  searchQuery,
  onSelectChat,
}: ConversationsListProps) {
  const t = useTranslations('chat');
  if (conversations.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {searchQuery ? 'No se encontraron conversaciones' : 'No tienes conversaciones aún'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => {
        const isActiveRow = highlightConversationId
          ? conversation.id === highlightConversationId
          : Boolean(
              activeChat &&
                (activeChat.id === conversation.otherParticipantId || activeChat.id === conversation.id),
            );
        return (
        <ConversationItem
          key={conversation.id}
          id={conversation.id}
          displayName={conversation.displayName}
          displayAvatar={conversation.displayAvatar}
          lastMessage={conversation.lastMessage ?? null}
          formattedTimestamp={conversation.formattedTimestamp}
          unreadCount={conversation.unreadCount}
          isActive={isActiveRow}
          isOnline={conversation.isOnline}
          onClick={() =>
            onSelectChat({
              id: conversation.otherParticipantId || conversation.id,
              name: conversation.displayName,
              avatar: conversation.displayAvatar,
              isOnline: conversation.isOnline,
            })
          }
        />
      );
      })}

      <div className="mt-4 px-3">
        <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
          {t('sidebar.onlineContacts')}
        </h3>
      </div>
    </div>
  );
}
