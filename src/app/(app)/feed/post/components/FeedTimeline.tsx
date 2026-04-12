'use client';

import { usePostSocketEvents } from '../hooks/usePostSocketEvents';
import { useReactionSocket } from '@/app/(app)/feed/reacions';
import PostCard from './PostCard';
import { usePosts } from '../hooks/usePosts';


export default function FeedTimeline() {
  const { data: posts = [], isLoading, error } = usePosts();

  // Activar WebSocket para actualizaciones en tiempo real
  usePostSocketEvents();
  useReactionSocket();

  // Mostrar mensaje de error si falla la carga
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-6 text-center">
        <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <svg
            className="h-7 w-7 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
          Error al cargar posts
        </h3>
        <p className="text-sm text-red-700 dark:text-red-300">
          {error.message || 'Ocurrió un error al cargar el feed. Por favor, intenta de nuevo.'}
        </p>
      </div>
    );
  }

  // Mostrar skeleton mientras carga
  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 rounded-xl p-6 animate-pulse"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
                <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="h-4 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="h-4 w-4/6 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Feed de Posts */}
      {posts.length > 0 ? (
        <>
          {/* Header del Feed 
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Posts Recientes
              </h2>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                </span>
              </div>
            </div>
          </div>*/}

          {/* Lista de Posts */}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </>
      ) : (
        // Estado vacío
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg
              className="h-10 w-10 text-neutral-400 dark:text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            No hay posts aún
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
            Sé el primero en compartir algo con la comunidad. Los posts aparecerán aquí en tiempo real.
          </p>
        </div>
      )}
    </div>
  );
}
