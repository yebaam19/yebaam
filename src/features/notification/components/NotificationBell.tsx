'use client';

import { useEffect, Fragment, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { usePathname } from 'next/navigation';
import { useNotificationRealtime } from '../hooks/useNotificationRealtime';
import Link from 'next/link';
import { Popover, Transition } from '@headlessui/react';
import { BellIcon } from '@/components/icons/heroicons-shim';
import { useNotificationStore } from '../store/notification.store';
import NotificationHeader from './NotificationHeader';
import type { GetNotificationsFilters } from '../interfaces/notification.interfaces';
import NotificationTabs from './NotificationTabs';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export default function NotificationBell() {
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
    error,
    pendingWrites,
  } = useNotificationStore();

  useNotificationRealtime();
  const userId = useAuthStore(state => state.user?.id);
  const pathname = usePathname();
  const [panelOpen, setPanelOpen] = useState(false);
  const pageFilters = useRef<GetNotificationsFilters | null>(null);
  const feedback = useTranslations('notification.feedback');
  const t = useTranslations('notification.bell');

  const [selectedTab, setSelectedTab] = useState<'all' | 'unread'>('all');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (userId && (panelOpen || pathname !== '/notifications')) {
      void fetchNotifications({ page: 1, limit: 20, filter: selectedTab });
    }
  }, [selectedTab, userId, panelOpen, pathname, fetchNotifications]);

  // Filtrar notificaciones según el tab seleccionado
  const displayedNotifications = selectedTab === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  // Manejar scroll infinito
  const handleScroll = useCallback(async (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollTop + container.clientHeight;
    const scrollHeight = container.scrollHeight;
    
    // Si llegamos al 80% del scroll y hay más notificaciones
    if (scrollPosition >= scrollHeight * 0.8 && hasMore && !isLoadingMore && !isLoading) {
      setIsLoadingMore(true);
      await loadMore();
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, isLoading, loadMore]);

  return (
    <Popover className="relative">
      {({ close }) => (
        <>
          {/* Botón de campana */}
          <Popover.Button
              aria-label={t('viewAll')}
              className={cn(
                'relative rounded-full p-2 transition-colors',
                'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
              )}
            >
              <BellIcon className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
              
              {/* Badge de contador */}
              {unreadCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-800 text-xs font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Popover.Button>

            {/* Dropdown */}
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
              beforeEnter={() => {
                pageFilters.current = useNotificationStore.getState().activeFilters;
                setPanelOpen(true);
              }}
              afterLeave={() => {
                setPanelOpen(false);
                if (pathname === '/notifications' && pageFilters.current) {
                  void fetchNotifications({ ...pageFilters.current, page: 1, before: undefined });
                }
                pageFilters.current = null;
              }}
            >
              <Popover.Panel className="absolute right-0 z-50 mt-2 w-[420px] max-w-[calc(100vw-2rem)]">
                <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-neutral-900 dark:ring-neutral-700">
                  {/* Header */}
                  <NotificationHeader
                    unreadCount={unreadCount}
                    onMarkAllAsRead={markAllAsRead}
                    disabled={pendingWrites > 0}
                  />

                  {error && (
                    <div role="alert" className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                      <span>{feedback('loadError')}</span>
                      <button className="font-semibold text-primary-800 dark:text-primary-400" onClick={() => void fetchNotifications({ page: 1, limit: 20, filter: selectedTab }, true)}>{feedback('retry')}</button>
                    </div>
                  )}
                  {/* Tabs */}
                  {(!error || notifications.length > 0) && <NotificationTabs
                    allNotifications={displayedNotifications}
                    unreadNotifications={displayedNotifications}
                    unreadCount={unreadCount}
                    isLoading={isLoading}
                    isLoadingMore={isLoadingMore}
                    hasMore={hasMore}
                    selectedTab={selectedTab}
                    onTabChange={setSelectedTab}
                    onScroll={handleScroll}
                    onNavigate={close}
                    onRead={markOneAsRead}
                    onDelete={deleteNotification}
                  />}

                  {/* Footer - Ver todas */}
                  {notifications.length > 0 && (
                    <div className="border-t border-neutral-200 dark:border-neutral-800">
                      <Link
                        href="/notifications"
                        onClick={() => { close(); setSelectedTab('all'); }}
                        className="block py-3 text-center text-sm font-semibold text-primary-800 hover:bg-neutral-50 dark:text-primary-400 dark:hover:bg-neutral-800 transition-colors"
                      >
                        {t('viewAll')}
                      </Link>
                    </div>
                  )}
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
    </Popover>
  );
}
