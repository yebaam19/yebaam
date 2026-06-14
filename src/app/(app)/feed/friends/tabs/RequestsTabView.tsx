'use client';

import { useTranslations } from 'next-intl';
import { FriendRequestCard } from '@/features/user/components/FriendRequestCard';
import type { useFriendships } from '@/features/friendships';

type FriendshipsApi = ReturnType<typeof useFriendships>;

interface RequestsTabViewProps {
  isLoading: boolean;
  pendingRequests: FriendshipsApi['pendingRequests'];
  onAccept: FriendshipsApi['acceptFriendRequest'];
  onReject: FriendshipsApi['rejectFriendRequest'];
}

export function RequestsTabView({
  isLoading,
  pendingRequests,
  onAccept,
  onReject,
}: RequestsTabViewProps) {
  const t = useTranslations('feed');

  if (isLoading) {
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

  if (!pendingRequests || pendingRequests.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-500 dark:text-neutral-400">{t('friends.empty.requests')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
      {pendingRequests.map((request) => (
        <FriendRequestCard
          key={request.id}
          request={{
            requestId: request.id,
            fromUserId: request.requesterId,
            message: request.message,
            sentAt: request.sentAt,
            status: request.status as 'pending' | 'accepted' | 'rejected',
            profile: request.profile ||
              request.senderProfile || {
                id: request.requesterId,
                username: `user_${request.requesterId.slice(0, 8)}`,
                firstName: 'Usuario',
                lastName: request.requesterId.slice(0, 8),
                avatar: undefined,
              },
          }}
          onAccept={onAccept}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
