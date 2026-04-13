'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, Squares2X2Icon, PhotoIcon, VideoCameraIcon, ListBulletIcon } from '@/components/icons/heroicons-shim';
import { useAuth } from '@/features/auth';
import { usePostStore } from '@/app/(app)/feed/post/stores/post.store';
import PostCard from '@/app/(app)/feed/post/components/PostCard';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'photos' | 'videos' | 'text';

interface FilterTab {
  id: FilterType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FILTERS: FilterTab[] = [
  { id: 'all', label: 'Todos', icon: Squares2X2Icon },
  { id: 'photos', label: 'Fotos', icon: PhotoIcon },
  { id: 'videos', label: 'Videos', icon: VideoCameraIcon },
  { id: 'text', label: 'Texto', icon: ListBulletIcon },
];

/**
 * Página de posts de un usuario
 * Similar a la sección de posts en el perfil de Facebook
 */
export default function UserPostsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const username = params.username as string;
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const posts = usePostStore((state) => state.posts);
  const isLoading = usePostStore((state) => state.isLoading);
  const fetchMyPosts = usePostStore((state) => state.fetchMyPosts);

  // Verificar si es el usuario actual
  const isCurrentUser = user?.username === username;

  // Filtrar posts del usuario y eliminar duplicados
  const userPosts = posts
    .filter(post => post.author.username === username || post.author.id === user?.id)
    .filter((post, index, self) => 
      // Eliminar duplicados basándose en el ID
      index === self.findIndex(p => p.id === post.id)
    );

  // Aplicar filtros adicionales
  const filteredPosts = userPosts.filter(post => {
    if (activeFilter === 'all') return true;
    
    if (activeFilter === 'photos') {
      return post.mediaFiles?.some(file => file.type === 'IMAGE');
    }
    
    if (activeFilter === 'videos') {
      return post.mediaFiles?.some(file => file.type === 'VIDEO');
    }
    
    if (activeFilter === 'text') {
      return !post.mediaFiles || post.mediaFiles.length === 0;
    }
    
    return true;
  });

  // Cargar posts al montar
  useEffect(() => {
    if (isCurrentUser && user?.id) {
      // Cargar posts solo si no hay posts cargados
      if (userPosts.length === 0) {
        fetchMyPosts({ limit: 50, page: 1 });
      }
    }
  }, [isCurrentUser, user?.id]);

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="rounded-full p-2 hover:bg-white dark:hover:bg-neutral-900 transition-colors"
              aria-label="Volver"
            >
              <ArrowLeftIcon className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {isCurrentUser ? 'Tus publicaciones' : `Publicaciones de @${username}`}
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'publicación' : 'publicaciones'}
                {activeFilter !== 'all' && ` • ${FILTERS.find(f => f.id === activeFilter)?.label}`}
              </p>
            </div>
          </div>
        </div>

        {/* Layout con Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Izquierdo */}
          <aside className="lg:col-span-3 space-y-4">
            {/* Filter Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-4 sticky top-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                Filtros
              </h3>
              <div className="space-y-1">
                {FILTERS.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.id;
                  
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all text-left',
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{filter.label}</span>
                      {filter.id === 'all' && (
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                          {userPosts.length}
                        </span>
                      )}
                      {filter.id === 'photos' && (
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                          {userPosts.filter(p => p.mediaFiles?.some(f => f.type === 'IMAGE')).length}
                        </span>
                      )}
                      {filter.id === 'videos' && (
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                          {userPosts.filter(p => p.mediaFiles?.some(f => f.type === 'VIDEO')).length}
                        </span>
                      )}
                      {filter.id === 'text' && (
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                          {userPosts.filter(p => !p.mediaFiles || p.mediaFiles.length === 0).length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                Estadísticas
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Total de posts
                  </span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">
                    {userPosts.length}
                  </span>
                </div>
                <div className="h-px bg-neutral-200 dark:bg-neutral-800" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Con fotos
                  </span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">
                    {userPosts.filter(p => p.mediaFiles?.some(f => f.type === 'IMAGE')).length}
                  </span>
                </div>
                <div className="h-px bg-neutral-200 dark:bg-neutral-800" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Con videos
                  </span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">
                    {userPosts.filter(p => p.mediaFiles?.some(f => f.type === 'VIDEO')).length}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9 space-y-4">{/* Loading state */}
        {isLoading && filteredPosts.length === 0 && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-white dark:bg-neutral-900 shadow-sm p-6 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-neutral-200 dark:bg-neutral-800 rounded-full shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
                      <div className="h-4 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Posts List */}
        {!isLoading && filteredPosts.length > 0 && (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredPosts.length === 0 && (
          <div className="rounded-xl bg-white dark:bg-neutral-900 shadow-sm p-12 text-center">
            <div className="mx-auto max-w-sm">
              {activeFilter === 'all' ? (
                <>
                  <div className="mb-4 text-6xl">📝</div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">
                    {isCurrentUser ? 'No tienes publicaciones' : 'No hay publicaciones'}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {isCurrentUser 
                      ? 'Comienza compartiendo tu primer post con tus amigos.'
                      : `@${username} aún no ha compartido ninguna publicación.`
                    }
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-4 text-6xl"></div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">
                    No hay {FILTERS.find(f => f.id === activeFilter)?.label.toLowerCase()}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Intenta con otro filtro para ver más publicaciones.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
          </main>
        </div>
      </div>
    </div>
  );
}
