'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, ChartBarIcon } from '@/components/icons/heroicons-shim';
import { useAuth } from '@/features/auth';
import { usePost } from '@/app/(app)/feed/post/hooks/usePosts';
import { PostCard } from '@/features/post';
import { useReactionStore, useReactionSocket } from '@/app/(app)/feed/reacions';
import { CommentList } from '@/app/(app)/feed/comments';



export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const postId = params.postId as string;
  const username = params.username as string;
  
  // Usar TanStack Query en lugar de Zustand
  const { data: currentPost, isLoading, error } = usePost(postId);
  
  const { countsByPost, fetchCounts, fetchMyReaction } = useReactionStore();
  
  // Activar escucha de eventos de reacciones en tiempo real
  useReactionSocket();

  useEffect(() => {
    if (postId) {
      // Cargar reacciones iniciales
      fetchCounts(postId);
      fetchMyReaction(postId);
    }
  }, [postId, fetchCounts, fetchMyReaction]);

  // Calcular total de reacciones
  const counts = countsByPost[postId];
  const totalReactions = counts 
    ? Object.values(counts).reduce((sum, count) => sum + count, 0)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
        <div className="mx-auto max-w-2xl px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            <div className="h-6 w-32 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          </div>

          {/* Post Skeleton */}
          <div className="rounded-xl bg-white dark:bg-neutral-900 shadow-sm p-6 animate-pulse">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-12 w-12 bg-neutral-200 dark:bg-neutral-800 rounded-full shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
                <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="h-4 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="h-4 w-4/6 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Error al cargar la publicación
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {error.message || 'Ha ocurrido un error'}
            </p>
            <button
              onClick={() => router.back()}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentPost) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Publicación no encontrada
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Esta publicación no existe o ha sido eliminada
            </p>
            <button
              onClick={() => router.back()}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header con botón de volver y estadísticas */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="rounded-full p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-neutral-900 dark:text-white" />
            </button>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
              Publicación de {currentPost.author.firstName}
            </h1>
          </div>

          {/* Botón de estadísticas - solo visible para el autor */}
          {user && currentPost.author.id === user.id && (
            <Link
              href={`/${username}/posts/${postId}/statistics`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-sm border border-neutral-200 dark:border-neutral-700"
            >
              <ChartBarIcon className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                Estadísticas
              </span>
              {totalReactions > 0 && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-600 px-2 py-0.5 rounded-full">
                  {totalReactions}
                </span>
              )}
            </Link>
          )}
        </div>

        {/* Post Card */}
        <PostCard post={currentPost} />

        {/* Sección de Comentarios */}
        <div className="mt-4 rounded-xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Comentarios
            </h2>
          </div>
          
          <CommentList 
            postId={postId}
            showInput={true}
            maxHeight="600px"
          />
        </div>
      </div>
    </div>
  );
}
