'use client';

import { useState } from 'react';
import { usePageConversations } from '../../hooks/usePageMessages';
import { PageConversation } from '../../interfaces/page-conversation.interface';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActiveConversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  unreadCount: number;
}

interface PageMessengerSidebarProps {
  pageId: string;
  activeConversation: ActiveConversation | null;
  onSelectConversation: (conversation: ActiveConversation) => void;
}

export function PageMessengerSidebar({
  pageId,
  activeConversation,
  onSelectConversation,
}: PageMessengerSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: conversationsData, isLoading } = usePageConversations(pageId, {
    page: 1,
    limit: 50,
    includeArchived: false,
  });

  const conversations = conversationsData?.conversations || [];

  // Filtrar conversaciones por búsqueda
  const filteredConversations = conversations.filter((conv) => {
    const userName = conv.userMetadata?.userName || 'Usuario';
    return userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelectConversation = (conv: PageConversation) => {
    onSelectConversation({
      id: conv.id,
      userId: conv.userId,
      userName: conv.userMetadata?.userName || 'Usuario',
      userAvatar: conv.userMetadata?.userAvatar || '',
      lastMessage: conv.lastMessage,
      unreadCount: conv.unreadCount,
    });
  };

  if (isLoading) {
    return (
      <div className="w-80 border-r border-neutral-200 dark:border-neutral-800 flex items-center justify-center bg-white dark:bg-neutral-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-neutral-500">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-900">
      {/* Search Bar */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-neutral-500">
            <p className="text-sm">
              {searchQuery ? 'No se encontraron conversaciones' : 'No hay mensajes aún'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {filteredConversations.map((conv) => {
              const isActive = activeConversation?.id === conv.id;
              const userName = conv.userMetadata?.userName || 'Usuario';
              const userAvatar = conv.userMetadata?.userAvatar;
              const timeAgo = formatDistanceToNow(new Date(conv.lastMessageAt), {
                addSuffix: true,
                locale: es,
              });

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
                    isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt={userName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                          {userName}
                        </h3>
                        <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
                          {timeAgo}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate flex-1">
                          {conv.lastMessage}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 flex-shrink-0 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
        <p className="text-xs text-neutral-600 dark:text-neutral-400 text-center">
          {conversationsData?.total || 0} conversaciones totales
        </p>
      </div>
    </div>
  );
}
