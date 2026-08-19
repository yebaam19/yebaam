'use client';

import { useTranslations } from 'next-intl';
import type { useFriendships } from '@/features/friendships';

type FriendshipsApi = ReturnType<typeof useFriendships>;

interface SentTabViewProps {
  isLoading: boolean;
  sentRequests: FriendshipsApi['sentRequests'];
  onCancel: (requestId: string) => void;
}

export function SentTabView({ isLoading, sentRequests, onCancel }: SentTabViewProps) {
  const t = useTranslations('feed');

  // Skeleton only while there is nothing to show yet (see FriendsTabView).
  if (isLoading && (!sentRequests || sentRequests.length === 0)) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"
          />
        ))}
      </div>
    );
  }

  if (!sentRequests || sentRequests.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-500 dark:text-neutral-400">{t('friends.empty.sent')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
      {sentRequests.map((request) => {
        const profile = request.profile || request.recipientProfile;

        const displayName = profile
          ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username
          : `${request.addresseeId?.slice(0, 8)}`;

        const initial =
          profile?.firstName?.charAt(0)?.toUpperCase() ||
          profile?.username?.charAt(0)?.toUpperCase() ||
          request.addresseeId?.charAt(0)?.toUpperCase() ||
          '?';

        return (
          <div
            key={`sent-${request.id}`}
            className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary-400 to-primary-600 text-xl font-bold text-white">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-neutral-900 dark:text-white">
                  {displayName}
                </h3>
                {profile?.username && (
                  <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">
                    @{profile.username}
                  </p>
                )}
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {t('friends.sentCard.sentOn', { date: new Date(request.sentAt).toLocaleDateString() })}
                </p>
                <button
                  onClick={() => onCancel(request.id)}
                  className="mt-4 w-full rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
                >
                  {t('friends.sentCard.cancel')}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
