'use client';

import { cn } from '@/lib/utils';
import Avatar from '@/ui/Avatar';
import { useTranslations } from 'next-intl';
import { type Conversation } from '@/features/chat/types';

type HeaderTranslate = ReturnType<typeof useTranslations<'header'>>;

function formatRelativeTime(date: Date | string, t: HeaderTranslate): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t('timeNow');
  if (diffMin < 60) return `${diffMin} ${t('timeMinutesShort')}`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} ${t('timeHoursShort')}`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} ${t('timeDaysShort')}`;
  return d.toLocaleDateString();
}

function previewFor(conv: Conversation, currentUserId: string, t: HeaderTranslate): string {
  const last = conv.lastMessage;
  if (!last) return t('noMessagesYet');
  const prefix = last.senderId === currentUserId ? t('youPrefix') : '';
  if (last.content && last.content.trim()) return prefix + last.content;
  if (last.media) return `${prefix}${t('attachment')}`;
  return prefix;
}

function initialsFor(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface Props {
  conv: Conversation;
  isOnline: boolean;
  currentUserId: string | null | undefined;
  onClick: () => void;
}

/** One conversation row in the messenger dropdown — avatar + presence dot,
 *  name, relative timestamp, last-message preview, and unread badge. */
export function MessengerConversationRow({ conv, isOnline, currentUserId, onClick }: Props) {
  const t = useTranslations('header');

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
      >
        <div className="relative shrink-0">
          <Avatar className="h-12 w-12" src={conv.avatar} initials={initialsFor(conv.name)} />
          {isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-neutral-900" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                'truncate text-sm',
                conv.unreadCount > 0
                  ? 'font-semibold text-neutral-900 dark:text-white'
                  : 'font-medium text-neutral-800 dark:text-neutral-200',
              )}
            >
              {conv.name ?? t('conversation')}
            </p>
            <span className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
              {formatRelativeTime(conv.updatedAt, t)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                'truncate text-xs',
                conv.unreadCount > 0
                  ? 'font-medium text-neutral-900 dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-400',
              )}
            >
              {currentUserId ? previewFor(conv, currentUserId, t) : ''}
            </p>
            {conv.unreadCount > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 px-1.5 text-xs font-bold text-white">
                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}
