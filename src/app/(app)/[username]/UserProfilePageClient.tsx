'use client';

/**
 * User Profile Page client UI
 *
 * Página principal del perfil de usuario con layout idéntico a páginas
 */

import { useFriendshipsStore } from '@/features/friendships/store/friendships.store';
import { useAuth } from '@/features/auth/context/auth-context';
import { CreatePostModal, EditPostModal, usePostStore } from '@/features/post';
import { ProfilePageSkeleton, UserProfileComponent } from '@/features/profile/components';
import { useProfile } from '@/features/profile/hooks/useProfile';
import CompleteAuthenticationBanner from '@/features/verification/components/CompleteAuthenticationBanner';
import { useFetch } from '@/lib/hooks/useFetch';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import ProfileTabPanels from './_components/ProfileTabPanels';
import ProfileTabsNav, { isValidTab, type TabType } from './_components/ProfileTabsNav';

interface UserProfilePageClientProps {
  username: string;
}

export default function UserProfilePageClient({ username }: UserProfilePageClientProps) {
  const t = useTranslations('profile');
  const searchParams = useSearchParams();
  const { user: currentUser, isInitialized } = useAuth();
  const { openCreateModal } = usePostStore();

  const initialTab = (() => {
    const t = searchParams?.get('tab');
    return isValidTab(t) ? t : 'publicaciones';
  })();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Sync state when ?tab= changes (e.g. via in-page links from sidebar).
  useEffect(() => {
    const t = searchParams?.get('tab');
    if (isValidTab(t) && t !== activeTab) {
      setActiveTab(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Lista de rutas reservadas que no son usernames
  const RESERVED_ROUTES = ['notifications', 'feed', 'settings', 'messages', 'search', 'explore'];
  const isReservedRoute = RESERVED_ROUTES.includes(username?.toLowerCase());

  // Fetch user profile (skipped via early-return below for reserved routes -- but
  // hook order must stay stable, so we always call it).
  const { profile: user, isLoading } = useProfile(isReservedRoute ? '' : username);

  // Live friend count for this profile (any user, not just the current one).
  const { data: friendCountData } = useFetch<{ count: number }>(
    ['friendships', 'count', user?.userId],
    async () => {
      if (!user?.userId) return { count: 0 };
      const res = await fetch(`/api/friendships/count?userId=${encodeURIComponent(user.userId)}`, {
        credentials: 'same-origin',
      });
      if (!res.ok) return { count: 0 };
      return (await res.json()) as { count: number };
    },
    { enabled: Boolean(user?.userId), staleTime: 60_000 }
  );
  const friendCount = friendCountData?.count ?? 0;

  // Whether this user has a professional profile visible to the viewer.
  const { data: professionalProfileData } = useFetch<{ exists: boolean }>(
    ['professional-profile', 'exists', user?.username],
    async () => {
      if (!user?.username) return { exists: false };
      const res = await fetch(
        `/api/users/${encodeURIComponent(user.username)}/has-professional-profile`,
        { credentials: 'same-origin' },
      );
      if (!res.ok) return { exists: false };
      return (await res.json()) as { exists: boolean };
    },
    { enabled: Boolean(user?.username), staleTime: 60_000 }
  );
  const professionalProfileExists = professionalProfileData?.exists ?? false;

  // Get friendship status and fetch functions
  const initializeFriendships = useFriendshipsStore((state) => state.initializeFriendships);
  const isFriendshipsInitialized = useFriendshipsStore((state) => state.isInitialized);

  // Load friendship data when component mounts
  useEffect(() => {
    if (currentUser?.id && !isFriendshipsInitialized) {
      initializeFriendships();
    }
  }, [currentUser?.id, isFriendshipsInitialized, initializeFriendships]);

  if (isReservedRoute) {
    return null; // La ruta específica (como /notifications) manejará su propio renderizado
  }

  // Mostrar skeleton mientras auth se inicializa o mientras se carga el perfil
  if (!isInitialized || isLoading) {
    return <ProfilePageSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{t('page.notFoundTitle')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('page.notFoundDescription')}</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === user.userId;

  return (
    <>
      {/* Header with cover and avatar */}
      <UserProfileComponent
        user={user}
        loggedInUserId={currentUser?.id || ''}
        friendshipInfo={{
          status: 'NONE',
          isRequester: false,
          friendCount,
        }}
        professionalProfileExists={professionalProfileExists}
      />

      {/* Reminder banner for own profile - Pitnik-style "complete your authentication". */}
      {isOwnProfile && currentUser?.id && (
        <CompleteAuthenticationBanner ownerUserId={currentUser.id} />
      )}

      {/* Tabs Navigation */}
      <ProfileTabsNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content Area with Sidebar Layout */}
      <ProfileTabPanels
        user={user}
        loggedInUserId={currentUser?.id || ''}
        isOwnProfile={isOwnProfile}
        hasCurrentUser={Boolean(currentUser)}
        activeTab={activeTab}
        onCreatePost={() => openCreateModal()}
      />

      {/* Modals */}
      <CreatePostModal />
      <EditPostModal />
    </>
  );
}
