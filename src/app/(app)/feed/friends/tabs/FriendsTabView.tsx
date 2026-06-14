'use client';

import { useTranslations } from 'next-intl';
import { FriendCard } from '@/features/user/components/FriendCard';
import type { useFriendships } from '@/features/friendships';

type FriendshipsApi = ReturnType<typeof useFriendships>;

interface FriendsTabViewProps {
  isLoading: boolean;
  friends: FriendshipsApi['friends'];
  onToggleCloseFriend: (friendId: string) => Promise<void>;
  onRemove: (friendshipId: string) => Promise<void>;
  onChat: (friendId: string) => void;
}

export function FriendsTabView({
  isLoading,
  friends,
  onToggleCloseFriend,
  onRemove,
  onChat,
}: FriendsTabViewProps) {
  const t = useTranslations('feed');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"
          />
        ))}
      </div>
    );
  }

  if (!friends || friends.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-500 dark:text-neutral-400">{t('friends.empty.friends')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
      {friends.map((friend) => (
        <FriendCard
          key={friend.friendId}
          friend={friend as any}
          onToggleCloseFriend={onToggleCloseFriend}
          onRemove={onRemove}
          onChat={onChat}
        />
      ))}
    </div>
  );
}
