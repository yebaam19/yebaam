'use client';

import { Tab } from '@headlessui/react';
import { cn } from '@/lib/utils';
import NotificationList from './NotificationList';
import type { Notification } from '../interfaces/notification.interfaces';
import { useTranslations } from 'next-intl';

interface NotificationTabsProps {
  allNotifications: Notification[];
  unreadNotifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  selectedTab: 'all' | 'unread';
  onTabChange: (tab: 'all' | 'unread') => void;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onRead: (notificationId: string) => Promise<void>;
  onDelete: (notificationId: string) => Promise<void>;
}

export default function NotificationTabs({
  allNotifications,
  unreadNotifications,
  unreadCount,
  isLoading,
  isLoadingMore,
  hasMore,
  selectedTab,
  onTabChange,
  onScroll,
  onRead,
  onDelete,
}: NotificationTabsProps) {
  const t = useTranslations('notification');
  return (
    <Tab.Group
      selectedIndex={selectedTab === 'all' ? 0 : 1} 
      onChange={(index) => onTabChange(index === 0 ? 'all' : 'unread')}
    >
      <Tab.List className="flex border-b border-neutral-200 dark:border-neutral-800">
        <Tab className={({ selected }) => cn(
          'flex-1 py-3 text-sm font-medium transition-colors',
          'focus:outline-none',
          selected
            ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
        )}>
          {t('tabs.all')}
        </Tab>
        <Tab className={({ selected }) => cn(
          'flex-1 py-3 text-sm font-medium transition-colors',
          'focus:outline-none',
          selected
            ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
        )}>
          {unreadCount > 0 ? t('tabs.unreadWithCount', { count: unreadCount }) : t('tabs.unread')}
        </Tab>
      </Tab.List>

      <Tab.Panels>
        {/* Tab: Todas */}
        <Tab.Panel>
          <NotificationList
            notifications={allNotifications}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            emptyMessage={{
              icon: 'bell',
              title: t('list.emptyAllTitle'),
              description: t('list.emptyAllDescription'),
            }}
            onScroll={onScroll}
            onRead={onRead}
            onDelete={onDelete}
          />
        </Tab.Panel>

        {/* Tab: No leídas */}
        <Tab.Panel>
          <NotificationList
            notifications={unreadNotifications}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            emptyMessage={{
              icon: 'check',
              title: t('list.emptyUnreadTitle'),
              description: t('list.emptyUnreadDescription'),
            }}
            onScroll={onScroll}
            onRead={onRead}
            onDelete={onDelete}
          />
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
}
