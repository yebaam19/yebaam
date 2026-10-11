'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useNotificationStore } from '@/features/notification/store/notification.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { NotificationType } from '../interfaces/notification.interfaces';
import type { GetNotificationsFilters } from '@/features/notification/interfaces/notification.interfaces';

export type FilterTab = 'all' | 'unread' | 'read' | 'mentions' | 'reactions' | 'comments';

export interface FilterOption {
  id: FilterTab;
  label: string;
  count?: number;
}

/**
 * View-model for the notifications page: active filter tab, the per-tab fetch,
 * client-side category filtering, infinite scroll, and mark-all-as-read.
 */
export function useNotificationsPage() {
  const userId = useAuthStore(state => state.user?.id);
  const t = useTranslations('notification.page');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    error,
    pendingWrites,
    fetchNotifications,
    loadMore,
    markOneAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();


  const filterTabs: FilterOption[] = [
    { id: 'all', label: t('tabAll') },
    { id: 'unread', label: t('tabUnread'), count: unreadCount },
    { id: 'read', label: t('tabRead') },
    { id: 'mentions', label: t('tabMentions') },
    { id: 'reactions', label: t('tabReactions') },
    { id: 'comments', label: t('tabComments') },
  ];

  // Cargar notificaciones según el filtro activo
  useEffect(() => {
    if (!userId) return;
    const filterMap: Record<FilterTab, GetNotificationsFilters> = {
      all: { filter: 'all' },
      unread: { filter: 'unread', isRead: false },
      read: { filter: 'read', isRead: true },
      mentions: { filter: 'all', type: NotificationType.POST_MENTION },
      reactions: { filter: 'all', type: NotificationType.POST_LIKE },
      comments: { filter: 'all', type: NotificationType.POST_COMMENT },
    };

    fetchNotifications({
      page: 1,
      limit: 20,
      ...filterMap[activeFilter],
    } as GetNotificationsFilters);
  }, [activeFilter, userId, fetchNotifications]);

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
    error,
    pendingWrites,
    retry: () => fetchNotifications({ ...useNotificationStore.getState().activeFilters, page: 1, before: undefined }, true),
    unreadCount,
    scrollContainerRef,
    handleScroll,
    handleMarkAllAsRead,
    markOneAsRead,
    deleteNotification,
  };
}
