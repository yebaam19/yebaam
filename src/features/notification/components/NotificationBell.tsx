'use client';

import { useEffect, Fragment, useState, useCallback } from 'react';
import Link from 'next/link';
import { Popover, Transition } from '@headlessui/react';
import { BellIcon } from '@/components/icons/heroicons-shim';
import { useNotificationStore } from '../store/notification.store';
import NotificationHeader from './NotificationHeader';
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
    startPolling,
    stopPolling,
  } = useNotificationStore();

  const t = useTranslations('notification.bell');

  const [selectedTab, setSelectedTab] = useState<'all' | 'unread'>('all');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Cargar notificaciones cuando cambia el tab
  useEffect(() => {
    const filter = selectedTab === 'all' ? 'all' : 'unread';
    fetchNotifications({ page: 1, limit: 20, filter });
  }, [selectedTab, fetchNotifications]);

  // Iniciar polling al montar el componente
  useEffect(() => {
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    // Recargar notificaciones después de marcar como leídas
    const filter = selectedTab === 'all' ? 'all' : 'unread';
    await fetchNotifications({ page: 1, limit: 20, filter });
  };

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
      const filter = selectedTab === 'all' ? 'all' : 'unread';
      await loadMore();
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, isLoading, loadMore, selectedTab]);

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          {/* Botón de campana */}
          <Popover.Button
              className={cn(
                'relative rounded-full p-2 transition-colors',
                'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
              )}
            >
              <BellIcon className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
              
              {/* Badge de contador */}
              {unreadCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
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
              afterEnter={() => {
                // Cargar notificaciones cuando el panel se abre
                const filter = selectedTab === 'all' ? 'all' : 'unread';
                fetchNotifications({ page: 1, limit: 20, filter });
              }}
            >
              <Popover.Panel className="absolute right-0 z-50 mt-2 w-[420px] max-w-md">
                <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-neutral-900 dark:ring-neutral-700">
                  {/* Header */}
                  <NotificationHeader
                    unreadCount={unreadCount}
                    onMarkAllAsRead={handleMarkAllAsRead}
                  />

                  {/* Tabs */}
                  <NotificationTabs
                    allNotifications={displayedNotifications}
                    unreadNotifications={displayedNotifications}
                    unreadCount={unreadCount}
                    isLoading={isLoading}
                    isLoadingMore={isLoadingMore}
                    hasMore={hasMore}
                    selectedTab={selectedTab}
                    onTabChange={setSelectedTab}
                    onScroll={handleScroll}
                    onRead={markOneAsRead}
                    onDelete={deleteNotification}
                  />

                  {/* Footer - Ver todas */}
                  {notifications.length > 0 && (
                    <div className="border-t border-neutral-200 dark:border-neutral-800">
                      <Link
                        href="/notifications"
                        className="block py-3 text-center text-sm font-semibold text-primary-600 hover:bg-neutral-50 dark:text-primary-400 dark:hover:bg-neutral-800 transition-colors"
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
