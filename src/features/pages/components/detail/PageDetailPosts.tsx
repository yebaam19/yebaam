import { FC, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  DocumentTextIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from '@/components/icons/heroicons-shim';
import { useFetch } from '@/lib/hooks/useFetch';
import { CreatePostCard } from '@/components/CreatePostCard';
import { usePostStore } from '@/app/(app)/feed/post/stores/post.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { postService } from '@/app/(app)/feed/post/services/post.service';
import PostCard from '@/app/(app)/feed/post/components/PostCard';
import { PagePostsGrid } from './pageposts/PagePostsGrid';

type PostsView = 'feed' | 'grid';

// Composer modal cargado bajo demanda para sacarlo del JS inicial de la página.
const CreatePostModal = dynamic(() => import('@/app/(app)/feed/post/components/CreatePostModal'), {
  ssr: false,
});

interface PageDetailPostsProps {
  pageId: string;
  isOwner?: boolean; // Solo el owner puede publicar
}

export const PageDetailPosts: FC<PageDetailPostsProps> = ({ pageId, isOwner = false }) => {
  const currentUser = useAuthStore((state) => state.user);
  const openCreateModal = usePostStore((s) => s.openCreateModal);
  const isCreateModalOpen = usePostStore((s) => s.isCreateModalOpen);
  const [view, setView] = useState<PostsView>('feed');

  // Fetch posts from API
  const { data: allPostsData, isLoading } = useFetch(
    ['page-posts', pageId],
    () => postService.getPagePosts(pageId),
    { enabled: !!pageId }
  );

  // Filtrar solo posts normales (excluir reels). useMemo estabiliza la
  // referencia que se pasa a PagePostsGrid y evita recomputar en cada render.
  const posts = useMemo(
    () => (allPostsData ?? []).filter((post) => !post.isReel),
    [allPostsData]
  );

  const handleCreatePostClick = () => {
    // Abrir modal con contexto de página
    openCreateModal(undefined, pageId);
  };

  return (
    <div className="space-y-4">
      {/* Create Post Card - Solo para el owner de la página */}
      {isOwner && currentUser && (
        <>
          <CreatePostCard
            user={currentUser}
            onCreateClick={handleCreatePostClick}
            className="mb-4"
          />
          {isCreateModalOpen && <CreatePostModal />}
        </>
      )}

      {/* Loading State */}
      {isLoading && (
        <>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/6" />
              </div>
            </div>
          ))}
        </>
      )}

      {/* Empty State */}
      {!isLoading && posts.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
            <DocumentTextIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Sin publicaciones aún
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isOwner
              ? 'Sé el primero en publicar algo en tu página.'
              : 'Esta página aún no ha compartido ninguna publicación.'}
          </p>
        </div>
      )}

      {/* View toggle (PDF §6: Feed vs Cuadrícula) — sólo con publicaciones */}
      {!isLoading && posts.length > 0 && (
        <div className="flex justify-end">
          <div
            role="group"
            aria-label="Cambiar vista de publicaciones"
            className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5"
          >
            <button
              type="button"
              onClick={() => setView('feed')}
              aria-pressed={view === 'feed'}
              aria-label="Vista de lista"
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'feed'
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <ListBulletIcon className="h-4 w-4" />
              Feed
            </button>
            <button
              type="button"
              onClick={() => setView('grid')}
              aria-pressed={view === 'grid'}
              aria-label="Vista de cuadrícula"
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'grid'
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
              Cuadrícula
            </button>
          </div>
        </div>
      )}

      {/* Posts — Feed o Cuadrícula */}
      {!isLoading && posts.length > 0 && (
        view === 'grid' ? (
          <PagePostsGrid posts={posts} />
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </>
        )
      )}
    </div>
  );
};
