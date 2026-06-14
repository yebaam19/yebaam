'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useNotificationStore } from '@/features/notification/store/notification.store';
import { useNotificationWebSocket } from '@/features/notification/hooks/useNotificationWebSocket';
import type { GetNotificationsFilters } from '@/features/notification/interfaces/notification.interfaces';

export type FilterTab = 'all' | 'unread' | 'read' | 'mentions' | 'reactions' | 'comments';

export interface FilterOption {
  id: FilterTab;
  label: string;
  count?: number;
}

// The mentions/reactions/comments tabs send coarse `type` values ('MENTION',
// 'REACTION', 'COMMENT') that are NOT members of the NotificationType enum, so
// the per-tab params are typed loosely and cast at the fetch boundary. The
// actual per-category filtering happens client-side in `filteredNotifications`.
// NOTE (flagged): those server-side `type` filters likely match nothing — worth
// revisiting whether the fetch params should use the real enum values.
type TabFetchParams = { filter: GetNotificationsFilters['filter']; isRead?: boolean; type?: string };

/**
 * View-model for the notifications page: active filter tab, the per-tab fetch,
 * client-side category filtering, infinite scroll, and mark-all-as-read.
 */
export function useNotificationsPage() {
  const t = useTranslations('notification.page');
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

  const filterTabs: FilterOption[] = [
    { id: 'all', label: t('tabAll'), count: notifications.length },
    { id: 'unread', label: t('tabUnread'), count: unreadCount },
    { id: 'read', label: t('tabRead') },
    { id: 'mentions', label: t('tabMentions') },
    { id: 'reactions', label: t('tabReactions') },
    { id: 'comments', label: t('tabComments') },
  ];

  // Cargar notificaciones según el filtro activo
  useEffect(() => {
    const filterMap: Record<FilterTab, TabFetchParams> = {
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
    } as GetNotificationsFilters);
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

  return {
    activeFilter,
    setActiveFilter,
    filterTabs,
    filteredNotifications,
    isLoading,
    isLoadingMore,
    hasMore,
    unreadCount,
    scrollContainerRef,
    handleScroll,
    handleMarkAllAsRead,
    markOneAsRead,
    deleteNotification,
  };
}
