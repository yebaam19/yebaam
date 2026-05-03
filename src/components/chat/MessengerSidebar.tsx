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
  onSelectChat: (chat: ActiveChat) => void;
  onNewMessage: () => void;
}

export default function MessengerSidebar({ activeChat, onSelectChat, onNewMessage }: MessengerSidebarProps) {
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
      <div className="w-80 border-r border-neutral-200 dark:border-neutral-800 flex items-center justify-center bg-white dark:bg-neutral-900">
        <p className="text-neutral-500">Cargando conversaciones...</p>
      </div>
    )
  }

  return (
    <div className="w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-900">
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
        searchQuery={searchQuery}
        onSelectChat={onSelectChat}
      />

      <NewMessageButton onClick={onNewMessage} />
    </div>
  );
}
