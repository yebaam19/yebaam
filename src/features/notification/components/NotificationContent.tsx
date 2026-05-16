'use client';

import { formatDistanceToNow } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import type { Notification } from '../interfaces/notification.interfaces';

interface NotificationContentProps {
  notification: Notification;
}

export default function NotificationContent({ notification }: NotificationContentProps) {
  const t = useTranslations('notification.type');
  const locale = useLocale();
  const dateLocale = locale === 'en' ? enUS : es;

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: dateLocale,
  });

  // Translate the verb phrase from the notification type. Fall back to the
  // server-provided string if a new type lands without a translation key yet
  // (next-intl in dev throws on missing keys, so guard with `t.has`).
  const typeKey = notification.type as string;
  const message = (t as unknown as { has: (k: string) => boolean }).has(typeKey)
    ? t(typeKey)
    : notification.message;

  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm text-neutral-900 dark:text-neutral-100">
        <span className="font-semibold">
          {notification.actor.displayName}
        </span>{' '}
        <span className="text-neutral-700 dark:text-neutral-300">
          {message}
        </span>
      </p>

      {notification.metadata?.postPreview && (
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
          {notification.metadata.postPreview}
        </p>
      )}

      {notification.metadata?.commentPreview && (
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
          &quot;{notification.metadata.commentPreview}&quot;
        </p>
      )}

      {notification.metadata?.postImageUrl && (
        <div className="mt-2">
          <img
            src={notification.metadata.postImageUrl}
            alt="Preview"
            className="h-16 w-16 rounded-lg object-cover"
          />
        </div>
      )}

      <div className="mt-1 flex items-center gap-2">
        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
          {timeAgo}
        </span>
      </div>
    </div>
  );
}
