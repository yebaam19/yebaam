'use client';

import Avatar from '@/ui/Avatar';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/features/auth/context/auth-context';
import { useFriendshipsStore } from '@/features/friendships/store/friendships.store';
import { friendshipsService, type Friend } from '@/features/friendships/services/friendships.service';

interface ProfileFriendsPreviewProps {
  userId: string;
  username: string;
}

export default function ProfileFriendsPreview({ userId, username }: ProfileFriendsPreviewProps) {
  const t = useTranslations('profile.sidebar');
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === userId;

  const ownFriends = useFriendshipsStore((state) => state.friends);
  const [otherFriends, setOtherFriends] = useState<Friend[]>([]);
  const [otherTotal, setOtherTotal] = useState(0);

  useEffect(() => {
    if (isOwnProfile) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await friendshipsService.getFriendsOf(userId);
        if (!cancelled) {
          setOtherFriends(result.friends);
          setOtherTotal(result.count);
        }
      } catch {
        // ignored — empty state will render
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOwnProfile, userId]);

  const friends = isOwnProfile ? ownFriends : otherFriends;
  const total = isOwnProfile ? ownFriends.length : otherTotal;

  const preview = useMemo(() => friends.slice(0, 6), [friends]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-lg font-bold">{t('friends')}</h2>
        <Link
          href={`/${username}?tab=amigos`}
          className="text-primary text-sm font-medium hover:underline"
        >
          {t('viewAllFriends')}
        </Link>
      </div>
      {total > 0 && (
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          {t('friendsCount', { count: total })}
        </p>
      )}

      {preview.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isOwnProfile ? t('friendsEmptyOwn') : t('friendsEmptyOther')}
          </p>
          {isOwnProfile && (
            <Link
              href={'/feed/friends?tab=suggestions' as Route}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {t('explorePeople')}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {preview.map((friend) => {
            const fullName = [friend.firstName, friend.lastName].filter(Boolean).join(' ') || friend.username;
            const initials = fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return (
              <Link
                key={friend.friendId}
                href={`/${friend.username}` as Route}
                className="group flex flex-col items-center gap-1"
              >
                <Avatar
                  src={friend.avatar}
                  alt={fullName}
                  initials={initials}
                  className="size-16 rounded-lg"
                />
                <span className="line-clamp-1 max-w-full text-center text-xs text-gray-700 group-hover:underline dark:text-gray-300">
                  {friend.firstName || friend.username}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
