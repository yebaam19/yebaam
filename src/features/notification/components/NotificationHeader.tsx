'use client';

import { CheckIcon } from '@/components/icons/heroicons-shim';

interface NotificationHeaderProps {
  unreadCount: number;
  onMarkAllAsRead: () => Promise<void>;
}

export default function NotificationHeader({ unreadCount, onMarkAllAsRead }: NotificationHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
        Notificaciones
      </h3>
      
      {unreadCount > 0 && (
        <button
          onClick={onMarkAllAsRead}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 transition-colors"
        >
          <CheckIcon className="h-4 w-4" />
          Marcar todas
        </button>
      )}
    </div>
  );
}
