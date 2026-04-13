import { FC } from 'react';
import { DocumentTextIcon } from '@/components/icons/heroicons-shim';
import { useQuery } from '@tanstack/react-query';
import { CreatePostCard } from '@/components/CreatePostCard';
import { CreatePostModal, usePostStore } from '@/features/post';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { postService } from '@/app/(app)/feed/post/services/post.service';
import PostCard from '@/app/(app)/feed/post/components/PostCard';

interface PageDetailPostsProps {
  pageId: string;
  isOwner?: boolean; // Solo el owner puede publicar
}

export const PageDetailPosts: FC<PageDetailPostsProps> = ({ pageId, isOwner = false }) => {
  const currentUser = useAuthStore((state) => state.user);
  const { openCreateModal } = usePostStore();
  
  // Fetch posts from API
  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ['page-posts', pageId],
    queryFn: () => postService.getPagePosts(pageId),
    enabled: !!pageId,
  });
  
  // Filtrar solo posts normales (excluir reels)
  const posts = allPosts.filter(post => !post.isReel);

  console.log('Posts cargados para la página:', posts);
  
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
          <CreatePostModal />
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

      {/* Real Posts */}
      {!isLoading && posts.length > 0 && (
        <>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </>
      )}
    </div>
  );
};
