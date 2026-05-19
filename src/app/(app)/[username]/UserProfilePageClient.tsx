'use client';

/**
 * User Profile Page client UI
 *
 * Página principal del perfil de usuario con layout idéntico a páginas
 */

import CreatePostCard from '@/components/CreatePostCard/CreatePostCard';
import { DocumentTextIcon, HomeIcon, InformationCircleIcon, PhotoIcon, UsersIcon, VideoCameraIcon } from '@/components/icons/heroicons-shim';
import { PawIcon } from '@/components/icons/PawIcon';
import { useFriendshipsStore } from '@/features/friendships/store/friendships.store';
import { useAuth } from '@/features/auth/context/auth-context';
import { CreatePostModal, EditPostModal, usePostStore } from '@/features/post';
import {
  AboutMe,
  ProfilePageSkeleton,
  ProfileSidebar,
  UserFamilies,
  UserFriends,
  UserPets,
  UserPhotos,
  UserPosts,
  UserProfileComponent,
  UserVideos,
} from '@/features/profile/components';
import { useProfile } from '@/features/profile/hooks/useProfile';
import CompleteAuthenticationBanner from '@/features/verification/components/CompleteAuthenticationBanner';
import { useFetch } from '@/lib/hooks/useFetch';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useState } from 'react';

type TabType =
  | 'publicaciones'
  | 'acerca-de'
  | 'amigos'
  | 'familias'
  | 'mascotas'
  | 'fotos'
  | 'videos';

const TABS: ReadonlyArray<{ id: TabType; labelKey: string; icon: typeof DocumentTextIcon }> = [
  { id: 'publicaciones', labelKey: 'publicaciones', icon: DocumentTextIcon },
  { id: 'acerca-de', labelKey: 'acercaDe', icon: InformationCircleIcon },
  { id: 'amigos', labelKey: 'amigos', icon: UsersIcon },
  { id: 'familias', labelKey: 'familias', icon: HomeIcon },
  { id: 'mascotas', labelKey: 'mascotas', icon: PawIcon as typeof DocumentTextIcon },
  { id: 'fotos', labelKey: 'fotos', icon: PhotoIcon },
  { id: 'videos', labelKey: 'videos', icon: VideoCameraIcon },
];

const TAB_IDS = new Set<TabType>(TABS.map((t) => t.id));

function isValidTab(value: string | null): value is TabType {
  return value !== null && TAB_IDS.has(value as TabType);
}

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
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-10 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-5xl min-w-0 px-3 sm:px-6 lg:px-8">
          <nav className="-mb-px flex gap-2 overflow-x-auto pb-px sm:gap-4 md:justify-between">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex shrink-0 items-center gap-1.5 border-b-2 px-1.5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors hover:cursor-pointer sm:gap-2 sm:px-2 ${
                    isActive
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${isActive ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-500'}`}
                  />
                  <span>{t(`tabs.${tab.labelKey}`)}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area with Sidebar Layout */}
      <div className="mx-auto max-w-5xl min-w-0 p-3 sm:p-4">
        <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-4">
          {/* Main Content */}
          <div className="min-w-0 lg:col-span-3">
            <div className="mx-auto max-w-3xl min-w-0">
              {activeTab === 'publicaciones' && (
                <div className="space-y-6">
                  {isOwnProfile && currentUser && (
                    <Suspense fallback={null}>
                      <CreatePostCard
                        user={{
                          avatar: user.avatarUrl || undefined,
                          username: user.username,
                        }}
                        onCreateClick={() => openCreateModal()}
                      />
                    </Suspense>
                  )}
                  <Suspense
                    fallback={<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>}
                  >
                    <UserPosts userId={user.userId} isOwnProfile={isOwnProfile} />
                  </Suspense>
                </div>
              )}

              {activeTab === 'acerca-de' && <AboutMe user={user} loggedInUserId={currentUser?.id || ''} />}

              {activeTab === 'amigos' && (
                <UserFriends userId={user.userId} isOwnProfile={isOwnProfile} />
              )}

              {activeTab === 'familias' && (
                <UserFamilies userId={user.userId} isOwnProfile={isOwnProfile} />
              )}

              {activeTab === 'mascotas' && (
                <Suspense
                  fallback={<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600"></div>}
                >
                  <UserPets userId={user.userId} ownerUsername={user.username} isOwnProfile={isOwnProfile} />
                </Suspense>
              )}

              {activeTab === 'fotos' && (
                <Suspense
                  fallback={<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>}
                >
                  <UserPhotos userId={user.userId} />
                </Suspense>
              )}

              {activeTab === 'videos' && (
                <Suspense
                  fallback={<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>}
                >
                  <UserVideos userId={user.userId} />
                </Suspense>
              )}

            </div>
          </div>

          {/* Sidebar - always visible */}
          <div className="min-w-0 lg:col-span-1">
            <div className="lg:sticky lg:top-[calc(5rem+env(safe-area-inset-top,0px))]">
              <ProfileSidebar user={user} loggedInUserId={currentUser?.id || ''} />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreatePostModal />
      <EditPostModal />
    </>
  );
}
