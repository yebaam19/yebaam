'use client';

import { useMessengerSidebar } from './hooks/useMessengerSidebar';
import SearchBar from './SearchBar';
import SidebarTabs from './SidebarTabs';
import ConversationsList from './ConversationsList';
import NewMessageButton from './NewMessageButton';

interface ActiveChat {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

interface MessengerSidebarProps {
  activeChat: ActiveChat | null;
  /** Highlights the open thread in full-page messenger (matches `conversations.id`). */
  highlightConversationId?: string | null;
  onSelectChat: (chat: ActiveChat) => void;
  onNewMessage: () => void;
}

export default function MessengerSidebar({
  activeChat,
  highlightConversationId,
  onSelectChat,
  onNewMessage,
}: MessengerSidebarProps) {
  const {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    conversations,
    isLoadingConversations,
    hasUnreadInActiveTab,
    markAllReadInActiveTab,
  } = useMessengerSidebar();

  if (isLoadingConversations) {
    return (
      <div className="flex h-full min-h-0 w-full shrink-0 flex-col items-center justify-center border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 md:w-80">
        <p className="text-neutral-500">Cargando conversaciones...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full shrink-0 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 md:w-80">
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
      />

      <SidebarTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasUnread={hasUnreadInActiveTab}
        onMarkAllRead={markAllReadInActiveTab}
      />

      <ConversationsList
        conversations={conversations}
        activeChat={activeChat}
        highlightConversationId={highlightConversationId}
        searchQuery={searchQuery}
        onSelectChat={onSelectChat}
      />

      <NewMessageButton onClick={onNewMessage} />
    </div>
  );
}
