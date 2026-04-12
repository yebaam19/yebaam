'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, CheckIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '@/features/notification';
import { useNotificationStore } from '@/features/notification/store/notification.store';
import { useNotificationWebSocket } from '@/features/notification/hooks/useNotificationWebSocket';
import NotificationItem from '@/features/notification/components/NotificationItem';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'unread' | 'read' | 'mentions' | 'reactions' | 'comments';

interface FilterOption {
  id: FilterTab;
  label: string;
  count?: number;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchNotifications,
    loadMore,
    markOneAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  // Conectar WebSocket para notificaciones en tiempo real
  useNotificationWebSocket();

  // Tabs de filtros
  const filterTabs: FilterOption[] = [
    { id: 'all', label: 'Todas', count: notifications.length },
    { id: 'unread', label: 'Sin leer', count: unreadCount },
    { id: 'read', label: 'Leídas' },
    { id: 'mentions', label: 'Menciones' },
    { id: 'reactions', label: 'Reacciones' },
    { id: 'comments', label: 'Comentarios' },
  ];

  // Cargar notificaciones según el filtro activo
  useEffect(() => {
    const filterMap: Record<FilterTab, any> = {
      all: { filter: 'all' },
      unread: { filter: 'unread', isRead: false },
      read: { filter: 'read', isRead: true },
      mentions: { filter: 'all', type: 'MENTION' },
      reactions: { filter: 'all', type: 'REACTION' },
      comments: { filter: 'all', type: 'COMMENT' },
    };

    fetchNotifications({
      page: 1,
      limit: 20,
      ...filterMap[activeFilter],
    });
  }, [activeFilter, fetchNotifications]);

  // Filtrar notificaciones según el tab activo
  const filteredNotifications = notifications.filter((notif) => {
    switch (activeFilter) {
      case 'all':
        return true;
      case 'unread':
        return !notif.isRead;
      case 'read':
        return notif.isRead;
      case 'mentions':
        return notif.type === 'POST_MENTION' || notif.type === 'COMMENT_MENTION';
      case 'reactions':
        return notif.type === 'POST_LIKE' || notif.type === 'COMMENT_LIKE';
      case 'comments':
        return notif.type === 'POST_COMMENT' || notif.type === 'COMMENT_REPLY';
      default:
        return true;
    }
  });

  // Infinite scroll
  const handleScroll = useCallback(async () => {
    const container = scrollContainerRef.current;
    if (!container || isLoadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Cargar más cuando llegue al 80% del scroll
    if (scrollPercentage > 0.8) {
      setIsLoadingMore(true);
      await loadMore();
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, loadMore]);

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    await markAllAsRead();
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Título y botón volver */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Volver"
              >
                <ArrowLeftIcon className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Notificaciones
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
                  </p>
                )}
              </div>
            </div>

            {/* Marcar todas como leídas */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
              >
                <CheckIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Marcar todas como leídas</span>
              </button>
            )}
          </div>

          {/* Filtros en tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  activeFilter === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-semibold',
                      activeFilter === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 180px)' }}
      >
        {isLoading ? (
          // Skeleton loading
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-neutral-900 rounded-lg p-4 animate-pulse"
              >
                <div className="flex gap-3">
                  <div className="h-12 w-12 bg-neutral-200 dark:bg-neutral-800 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          // Lista de notificaciones
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <NotificationItem
                  notification={notification}
                  onRead={markOneAsRead}
                  onDelete={deleteNotification}
                />
              </div>
            ))}

            {/* Loading más notificaciones */}
            {isLoadingMore && hasMore && (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
              </div>
            )}

            {/* No hay más notificaciones */}
            {!hasMore && filteredNotifications.length > 5 && (
              <div className="py-8 text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  No hay más notificaciones
                </p>
              </div>
            )}
          </div>
        ) : (
          // Estado vacío
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="h-24 w-24 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
              <CheckIcon className="h-12 w-12 text-neutral-400 dark:text-neutral-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              {activeFilter === 'unread'
                ? '¡Todo al día!'
                : activeFilter === 'read'
                  ? 'No hay notificaciones leídas'
                  : 'No tienes notificaciones'}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm">
              {activeFilter === 'unread'
                ? 'No tienes notificaciones sin leer'
                : 'Las notificaciones sobre tu actividad aparecerán aquí'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
