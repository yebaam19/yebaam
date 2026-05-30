'use client';

import { useTranslations } from 'next-intl';
import { CheckIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import { cn } from '@/lib/utils';

export interface SearchResult {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isFriend: boolean;
}

export function displayNameFor(user: Pick<SearchResult, 'firstName' | 'lastName' | 'username'>, fallback: string): string {
  return user.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim()
    : user.username || fallback;
}

interface UserRowProps {
  user: SearchResult;
  /** Friends render a selection checkbox; non-friends open a direct chat on click. */
  selectable: boolean;
  selected?: boolean;
  disabled?: boolean;
  pending?: boolean;
  onClick: () => void;
}

export default function UserRow({ user, selectable, selected, disabled, pending, onClick }: UserRowProps) {
  const t = useTranslations('chat.newMessage');
  const displayName = displayNameFor(user, t('userFallback'));
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Avatar src={user.avatar ?? null} alt={displayName} initials={initials} className="h-10 w-10" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{displayName}</div>
        {user.username && (
          <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">@{user.username}</div>
        )}
      </div>
      {pending && <span className="text-xs text-neutral-500">{t('opening')}</span>}
      {selectable && (
        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
            selected
              ? 'border-primary-600 bg-primary-600 text-white'
              : 'border-neutral-300 dark:border-neutral-600',
          )}
        >
          {selected && <CheckIcon className="h-3.5 w-3.5" />}
        </span>
      )}
    </button>
  );
}
