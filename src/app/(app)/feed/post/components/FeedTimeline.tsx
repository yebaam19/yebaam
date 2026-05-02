'use client';

import { useEffect, useRef } from 'react';
import { usePostSocketEvents } from '../hooks/usePostSocketEvents';
import { useReactionSocket, useReactionStore } from '@/app/(app)/feed/reacions';
import { useAuth } from '@/features/auth';
import PostCard from './PostCard';
import { usePosts, useSuggestedPosts } from '../hooks/usePosts';
import { getCached, setCached } from '@/lib/hooks/cacheStore';
import type { Post } from '../interfaces/post.interfaces';

interface FeedTimelineProps {
  initialPosts?: Post[];
}

const TIMELINE_CACHE_KEY = 'posts::timeline';

export default function FeedTimeline({ initialPosts }: FeedTimelineProps = {}) {
  // Seed the shared cache with server-rendered posts exactly once so that
  // `usePosts` (which reads from the same cache via useSyncExternalStore) can
  // pick up optimistic inserts from createPost and re-render instantly.
  const seeded = useRef(false);
  if (!seeded.current && initialPosts && initialPosts.length > 0) {
    if (!getCached(TIMELINE_CACHE_KEY)) {
      setCached(TIMELINE_CACHE_KEY, { data: initialPosts, fetchedAt: Date.now() });
    }
    seeded.current = true;
  }

  const query = usePosts({ enabled: true });
  const posts: Post[] = query.data ?? initialPosts ?? [];
  const isLoading = posts.length === 0 && query.isLoading;
  const error = query.error;

  // Fetch suggestions only when the friends-feed came back empty.
  const showSuggestions = !isLoading && !error && posts.length === 0;
  const suggestionsQuery = useSuggestedPosts({ enabled: showSuggestions });
  const suggestedPosts: Post[] = suggestionsQuery.data ?? [];

  // Activar WebSocket para actualizaciones en tiempo real
  usePostSocketEvents();
  useReactionSocket();

  // Bulk-load the current user's reaction for every visible post in one query.
  // Replaces the per-post fetchMyReaction effect that fired N requests on render.
  const { user } = useAuth();
  const fetchMyReactionsForPosts = useReactionStore((s) => s.fetchMyReactionsForPosts);
  const visibleIds = posts.length > 0 ? posts.map((p) => p.id).join(',') : '';
  useEffect(() => {
    if (!user?.id || !visibleIds) return;
    void fetchMyReactionsForPosts(visibleIds.split(','));
  }, [user?.id, visibleIds, fetchMyReactionsForPosts]);

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
        <>
          {/* Estado vacío del feed */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-neutral-400 dark:text-neutral-500"
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
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
              Tu feed está vacío
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
              Conecta con amigos o únete a clubes para ver sus publicaciones aquí.
            </p>
          </div>

          {/* Sugerencias: posts de personas que quizás conozcas */}
          {suggestedPosts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1 pt-2">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Sugerencias
                </h2>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  · posts de personas que quizás conozcas
                </span>
              </div>
              {suggestedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
