'use client';

import { useTranslations } from 'next-intl';
import UserRow, { type SearchResult } from './UserRow';

interface ResultsListProps {
  filteredFriends: SearchResult[];
  remoteResults: SearchResult[];
  selectedIds: Set<string>;
  debouncedQuery: string;
  isSearching: boolean;
  showRemote: boolean;
  nothingFound: boolean;
  isSubmitting: boolean;
  pendingId: string | null;
  onToggleFriend: (user: SearchResult) => void;
  onOpenDirect: (user: SearchResult) => void;
}

export default function ResultsList({
  filteredFriends,
  remoteResults,
  selectedIds,
  debouncedQuery,
  isSearching,
  showRemote,
  nothingFound,
  isSubmitting,
  pendingId,
  onToggleFriend,
  onOpenDirect,
}: ResultsListProps) {
  const t = useTranslations('chat.newMessage');

  return (
    <div className="max-h-[50vh] overflow-y-auto">
      {filteredFriends.length > 0 && (
        <div>
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{t('friends')}</div>
          {filteredFriends.map((user) => (
            <UserRow key={user.id} user={user} selectable selected={selectedIds.has(user.id)} disabled={isSubmitting} onClick={() => onToggleFriend(user)} />
          ))}
        </div>
      )}

      {showRemote && (
        <div>
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{t('otherPeople')}</div>
          {remoteResults.map((user) => (
            <UserRow key={user.id} user={user} selectable={false} pending={pendingId === user.id} disabled={!!pendingId || isSubmitting} onClick={() => onOpenDirect(user)} />
          ))}
        </div>
      )}

      {isSearching && debouncedQuery.length >= 2 && (
        <div className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">{t('searching')}</div>
      )}
      {nothingFound && (
        <div className="px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">{t('noResults', { query: debouncedQuery })}</div>
      )}
      {!debouncedQuery && filteredFriends.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">{t('noFriendsYet')}</div>
      )}
    </div>
  );
}
