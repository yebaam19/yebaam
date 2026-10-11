'use client';

import { useRef } from 'react';
import { BellIcon, CheckIcon } from '@/components/icons/heroicons-shim';
import NotificationItem from './NotificationItem';
import type { Notification } from '../interfaces/notification.interfaces';
import { useTranslations } from 'next-intl';

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  emptyMessage?: {
    icon?: 'bell' | 'check';
    title: string;
    description: string;
  };
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  onNavigate?: () => void;
  onRead: (notificationId: string) => Promise<void>;
  onDelete: (notificationId: string) => Promise<void>;
}

export default function NotificationList({
  notifications,
  isLoading,
  isLoadingMore,
  hasMore,
  emptyMessage,
  onScroll,
  onRead,
  onNavigate,
  onDelete,
}: NotificationListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('notification.list');

  return (
    <div 
      ref={scrollContainerRef}
      className="max-h-[min(480px,60dvh)] overflow-y-auto overscroll-contain"
      aria-busy={isLoading || isLoadingMore}
      onScroll={onScroll}
    >
      {isLoading && notifications.length === 0 ? (
        // Loading state inicial
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : notifications.length > 0 ? (
        // Lista de notificaciones
        <>
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {notifications.map((notification) => {
              return (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={onRead}
                  onNavigate={onNavigate}
                  onDelete={onDelete}
                />
              );
            })}
          </div>
          
          {/* Loading más notificaciones */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            </div>
          )}
          
          {/* No hay más notificaciones */}
          {!hasMore && notifications.length > 5 && (
            <div className="py-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
              {t('noMore')}
            </div>
          )}
        </>
      ) : (
        // Estado vacío
        <div className="flex flex-col items-center justify-center py-12 px-4">
          {emptyMessage?.icon === 'check' ? (
            <CheckIcon className="h-12 w-12 text-neutral-300 dark:text-neutral-700" />
          ) : (
            <BellIcon className="h-12 w-12 text-neutral-300 dark:text-neutral-700" />
          )}
          <p className="mt-3 text-sm font-medium text-neutral-900 dark:text-white">
            {emptyMessage?.title || t('emptyAllTitle')}
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {emptyMessage?.description || t('emptyAllDescription')}
          </p>
        </div>
      )}
    </div>
  );
}
