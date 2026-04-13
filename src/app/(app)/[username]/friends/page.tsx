'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/features/auth/context/auth-context';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { friendshipsService, type Friend } from '@/features/friendships/services/friendships.service';
import ProfileFriendsFull from '../components/ProfileFriendsFull';
import { ProfilePageSkeleton } from '@/features/profile/components';

export default function UserFriendsPage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser, isInitialized } = useAuth();
  const { profile: user, isLoading: isProfileLoading } = useProfile(username);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);

  useEffect(() => {
    if (!user?.userId) return;
    let cancelled = false;
    setIsLoadingFriends(true);
    friendshipsService
      .getFriendsOf(user.userId)
      .then((res) => {
        if (cancelled) return;
        setFriends(res.friends);
      })
      .catch(() => {
        if (cancelled) return;
        setFriends([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingFriends(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

  if (!isInitialized || isProfileLoading) {
    return <ProfilePageSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Usuario no encontrado</h2>
          <p className="text-gray-600 dark:text-gray-400">El perfil que buscas no existe o no está disponible.</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === user.userId;

  const mappedFriends = friends.map((f) => ({
    id: f.friendId,
    username: f.username,
    displayName:
      f.firstName && f.lastName ? `${f.firstName} ${f.lastName}` : f.username,
    avatar: f.avatar,
    mutualFriends: 0,
    isOnline: false,
  }));

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      {isLoadingFriends ? (
        <div className="flex min-h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      ) : (
        <ProfileFriendsFull
          username={username}
          friends={mappedFriends}
          totalFriends={friends.length}
          isOwnProfile={isOwnProfile}
        />
      )}
    </div>
  );
}
