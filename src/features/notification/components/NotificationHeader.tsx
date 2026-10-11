'use client';

import { CheckIcon } from '@/components/icons/heroicons-shim';
import { useTranslations } from 'next-intl';

interface NotificationHeaderProps {
  unreadCount: number;
  disabled?: boolean;
  onMarkAllAsRead: () => Promise<void>;
}

export default function NotificationHeader({ unreadCount, onMarkAllAsRead, disabled }: NotificationHeaderProps) {
  const t = useTranslations('notification.header');
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
        {t('title')}
      </h3>

      {unreadCount > 0 && (
        <button
          disabled={disabled}
          onClick={onMarkAllAsRead}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-primary-800 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary-800"
        >
          <CheckIcon className="h-4 w-4" />
          {t('markAll')}
        </button>
      )}
    </div>
  );
}
