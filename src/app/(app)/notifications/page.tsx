'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, CheckIcon } from '@/components/icons/heroicons-shim';
import NotificationItem from '@/features/notification/components/NotificationItem';
import { useNotificationsPage } from '@/features/notification/hooks/useNotificationsPage';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export default function NotificationsPage() {
  const router = useRouter();
  const t = useTranslations('notification.page');
  const {
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
  } = useNotificationsPage();

  return (
    <div className="min-h-dvh min-w-0 bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-10 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-4xl min-w-0 px-3 sm:px-6 lg:px-8">
          <div className="flex h-16 min-w-0 items-center justify-between gap-2">
            {/* Título y botón volver */}
            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label={t('back')}
              >
                <ArrowLeftIcon className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-neutral-900 sm:text-2xl dark:text-white">
                  {t('title')}
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t('newCount', { count: unreadCount })}
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
                <span className="hidden sm:inline">{t('markAllAsRead')}</span>
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
        className="mx-auto max-w-4xl min-w-0 overflow-y-auto px-3 py-6 sm:px-6 lg:px-8"
        style={{ maxHeight: 'calc(100dvh - 12rem - env(safe-area-inset-top, 0px))' }}
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
                  {t('noMore')}
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
                ? t('emptyUnreadTitle')
                : activeFilter === 'read'
                  ? t('emptyReadTitle')
                  : t('emptyAllTitle')}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm">
              {activeFilter === 'unread'
                ? t('emptyUnreadDescription')
                : t('emptyDescription')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
