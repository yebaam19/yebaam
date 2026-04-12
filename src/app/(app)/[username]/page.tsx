'use client';

/**
 * User Profile Page
 *
 * Página principal del perfil de usuario con layout idéntico a páginas
 */

import CreatePostCard from '@/components/CreatePostCard/CreatePostCard';
import { useAuth } from '@/features/auth/context/auth-context';
import { CreatePostModal, EditPostModal, usePostStore } from '@/features/post';
import {
  AboutMe,
  ProfilePageSkeleton,
  UserDetails,
  UserPhotos,
  UserPosts,
  UserProfileComponent,
  UserVideos,
} from '@/features/profile/components';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useFriendshipsStore } from '@/features/friendships/store/friendships.store';

import {
  DocumentTextIcon,
  HomeIcon,
  InformationCircleIcon,
  PhotoIcon,
  SparklesIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { useParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';

type TabType = 'inicio' | 'publicaciones' | 'acerca-de' | 'fotos' | 'videos' | 'historias' | 'mascotas';

type SidebarSection = 'detalles' | 'amigos' | 'fotos-sidebar' | 'videos-sidebar' | 'grupos' | 'eventos';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser, isInitialized } = useAuth();
  const { openCreateModal } = usePostStore();
  const [activeTab, setActiveTab] = useState<TabType>('inicio');
  const [sidebarSection, setSidebarSection] = useState<SidebarSection | null>(null);

  // Lista de rutas reservadas que no son usernames
  const RESERVED_ROUTES = ['notifications', 'feed', 'settings', 'messages', 'search', 'explore'];
  
  // Si es una ruta reservada, no renderizar esta página (Next.js manejará la ruta específica)
  const isReservedRoute = RESERVED_ROUTES.includes(username?.toLowerCase());
  
  if (isReservedRoute) {
    return null; // La ruta específica (como /notifications) manejará su propio renderizado
  }

  // Fetch user profile
  const { profile: user, isLoading } = useProfile(username);

  // Get friendship status and fetch functions
  const initializeFriendships = useFriendshipsStore(state => state.initializeFriendships);
  const isFriendshipsInitialized = useFriendshipsStore(state => state.isInitialized);

  // Load friendship data when component mounts
  useEffect(() => {
    if (currentUser?.id && isFriendshipsInitialized) {
      return;
    }

    if (currentUser?.id && !isFriendshipsInitialized) {
      initializeFriendships();
    }
  }, [currentUser?.id, isFriendshipsInitialized, initializeFriendships]);

  // Reset sidebar when changing main tabs
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSidebarSection(null);
  };

  // Mostrar skeleton mientras auth se inicializa o mientras se carga el perfil
  if (!isInitialized || isLoading) {
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

  return (
    <>
      {/* Header with cover and avatar */}
      <UserProfileComponent
        user={user}
        loggedInUserId={currentUser?.id || ''}
        friendshipInfo={{
          status: 'NONE',
          isRequester: false,
          friendCount: 0, // FriendButton now handles all friendship state internally
        }}
      />

      {/* Tabs Navigation - EXACTO como páginas */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {[
              { id: 'inicio', label: 'Inicio', icon: HomeIcon },
              { id: 'publicaciones', label: 'Publicaciones', icon: DocumentTextIcon },
              { id: 'acerca-de', label: 'Acerca de', icon: InformationCircleIcon },
              { id: 'fotos', label: 'Fotos', icon: PhotoIcon },
              { id: 'videos', label: 'Videos', icon: VideoCameraIcon },
              { id: 'historias', label: 'Historias', icon: SparklesIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as TabType)}
                  className={`group inline-flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors hover:cursor-pointer ${isActive
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                >
                  <Icon
                    className={`h-5 w-5 ${isActive ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-500'}`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area with Sidebar Layout - EXACTO como páginas */}
      <div className="mx-auto max-w-5xl p-4">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mx-auto max-w-3xl">
              {/* Main Tab Content */}
              {!sidebarSection && (
                <>
                  {activeTab === 'inicio' && (
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

                  {activeTab === 'historias' && (
                    <div className="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-gray-800">
                      <div className="mx-auto max-w-md">
                        <div className="mb-4 flex justify-center">
                          <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-700">
                            <SparklesIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        </div>
                        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Próximamente</h2>
                        <p className="text-gray-600 dark:text-gray-400">Las historias estarán disponibles muy pronto.</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Sidebar Section Content */}
              {sidebarSection === 'detalles' && <UserDetails user={user} loggedInUserId={currentUser?.id || ''} />}

              {sidebarSection === 'fotos-sidebar' && (
                <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>}>
                  <UserPhotos userId={user.userId} />
                </Suspense>
              )}

              {sidebarSection === 'videos-sidebar' && (
                <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>}>
                  <UserVideos userId={user.userId} />
                </Suspense>
              )}
            </div>
          </div>

          {/* Sidebar - EXACTO como páginas */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              {/* About Card (only in inicio tab) */}
              {activeTab === 'inicio' && !sidebarSection && (
                <div className="mb-6">
                  <UserDetails user={user} loggedInUserId={currentUser?.id || ''} />
                </div>
              )}

              {/* Sidebar Navigation - EXACTO como PageDetailSidebar */}
              <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                <div className="space-y-3">
                  <h3 className="px-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Más sobre {user.firstName}
                  </h3>

                  <nav className="space-y-1">
                    {[
                      { id: 'detalles', label: 'Detalles', icon: InformationCircleIcon },
                      { id: 'fotos-sidebar', label: 'Fotos', icon: PhotoIcon, count: user._count?.posts || 0 },
                      { id: 'videos-sidebar', label: 'Videos', icon: VideoCameraIcon },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = sidebarSection === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => setSidebarSection(item.id as SidebarSection)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${isActive
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
                            />
                            <span
                              className={`text-sm font-medium ${isActive ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                                }`}
                            >
                              {item.label}
                            </span>
                          </div>
                          {item.count !== undefined && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isActive
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                }`}
                            >
                              {item.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>

                  {/* Info Card */}
                  <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Explora más</h4>
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                      Descubre más sobre {user.firstName}, sus fotos, videos y publicaciones.
                    </p>
                  </div>
                </div>
              </div>
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
