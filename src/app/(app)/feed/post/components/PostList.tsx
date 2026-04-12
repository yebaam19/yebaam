'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePostStore } from '../stores/post.store';
import PostCard from './PostCard';
import type { GetPostsFilters } from '../interfaces/post.interfaces';

interface PostListProps {
  userId?: string; // Si se proporciona, muestra posts de ese usuario. Si no, muestra timeline
  filters?: Omit<GetPostsFilters, 'page' | 'limit'>;
  className?: string;
}

export default function PostList({ userId, filters, className }: PostListProps) {
  const {
    posts,
    isLoading,
    error,
    currentPage,
    hasMore,
    fetchTimeline,
    fetchUserPosts,
  } = usePostStore();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Función para cargar posts
  const loadPosts = useCallback(
    async (page: number) => {
      const queryFilters: GetPostsFilters = {
        ...filters,
        page,
        limit: 10,
      };

      if (userId) {
        await fetchUserPosts(userId, queryFilters);
      } else {
        await fetchTimeline(queryFilters);
      }
    },
    [userId, filters, fetchTimeline, fetchUserPosts]
  );

  // Cargar posts iniciales
  useEffect(() => {
    if (posts.length === 0) {
      loadPosts(1);
    }
  }, []);

  // Intersection Observer para scroll infinito
  useEffect(() => {
    if (isLoading || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadPosts(currentPage + 1);
        }
      },
      {
        threshold: 0.5,
      }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observerRef.current.observe(currentLoadMoreRef);
    }

    return () => {
      if (observerRef.current && currentLoadMoreRef) {
        observerRef.current.unobserve(currentLoadMoreRef);
      }
    };
  }, [isLoading, hasMore, currentPage, loadPosts]);

  // Estado de error
  if (error && posts.length === 0) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm dark:bg-neutral-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">
          Error al cargar posts
        </h3>
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">{error}</p>
        <button
          onClick={() => loadPosts(1)}
          className="rounded-lg bg-primary-600 px-6 py-2 font-medium text-white hover:bg-primary-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Estado vacío
  if (!isLoading && posts.length === 0) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm dark:bg-neutral-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <svg
            className="h-8 w-8 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">
          No hay publicaciones aún
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {userId
            ? 'Este usuario no ha publicado nada todavía'
            : 'Sé el primero en compartir algo con tus amigos'}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Loading inicial */}
        {isLoading && posts.length === 0 && (
          <>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900"
              >
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
                </div>
                <div className="mt-4 h-64 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
              </div>
            ))}
          </>
        )}

        {/* Posts */}
        {posts.map((post, index) => (
          <PostCard 
            key={post.id || `post-${index}-${post.createdAt}`} 
            post={post} 
          />
        ))}

        {/* Loading más posts */}
        {hasMore && (
          <div ref={loadMoreRef} className="py-8 text-center">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                <span>Cargando más posts...</span>
              </div>
            )}
          </div>
        )}

        {/* No hay más posts */}
        {!hasMore && posts.length > 0 && (
          <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            No hay más publicaciones para mostrar
          </div>
        )}
      </div>
    </div>
  );
}
