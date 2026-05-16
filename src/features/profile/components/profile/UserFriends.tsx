'use client';

import Avatar from '@/ui/Avatar';
import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowPathIcon, UsersIcon } from '@/components/icons/heroicons-shim';
import { useFriendshipsStore } from '@/features/friendships/store/friendships.store';
import {
  friendshipsService,
  type Friend,
} from '@/features/friendships/services/friendships.service';

interface UserFriendsProps {
  userId: string;
  isOwnProfile: boolean;
}

export default function UserFriends({ userId, isOwnProfile }: UserFriendsProps) {
  const t = useTranslations('profile.friends');
  const ownFriends = useFriendshipsStore((state) => state.friends);
  const ownLoading = useFriendshipsStore((state) => state.isLoading);
  const ownInitialized = useFriendshipsStore((state) => state.isInitialized);

  const [otherFriends, setOtherFriends] = useState<Friend[]>([]);
  const [otherLoading, setOtherLoading] = useState(true);

  useEffect(() => {
    if (isOwnProfile) return;
    let cancelled = false;
    setOtherLoading(true);
    (async () => {
      try {
        const result = await friendshipsService.getFriendsOf(userId);
        if (!cancelled) setOtherFriends(result.friends);
      } catch {
        if (!cancelled) setOtherFriends([]);
      } finally {
        if (!cancelled) setOtherLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOwnProfile, userId]);

  const friends = isOwnProfile ? ownFriends : otherFriends;
  const isLoading = isOwnProfile ? ownLoading || !ownInitialized : otherLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <ArrowPathIcon className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="rounded-2xl bg-white py-12 text-center shadow-sm dark:bg-gray-800">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
          <UsersIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          {isOwnProfile ? t('emptyOwnTitle') : t('emptyOtherTitle')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isOwnProfile ? t('emptyOwnSubtitle') : ''}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('title')}</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {t('count', { count: friends.length })}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {friends.map((friend) => {
          const fullName =
            [friend.firstName, friend.lastName].filter(Boolean).join(' ') || friend.username;
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
              className="group flex flex-col items-center gap-2 rounded-xl border border-transparent p-3 transition-colors hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-700/50"
            >
              <Avatar
                src={friend.avatar}
                alt={fullName}
                initials={initials}
                className="size-20 rounded-xl"
              />
              <span className="line-clamp-1 max-w-full text-center text-sm font-medium text-gray-800 group-hover:underline dark:text-gray-200">
                {fullName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">@{friend.username}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
