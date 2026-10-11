'use client';

import { useEffect, useLayoutEffect } from 'react';
import { usePostSocketEvents } from '../hooks/usePostSocketEvents';
import { useReactionSocket, useReactionStore } from '@/app/(app)/feed/reacions';
import { useAuth } from '@/features/auth';
import PostCard from './PostCard';
import { useSuggestedPosts } from '../hooks/usePosts';
import { useTranslations } from 'next-intl';
import { useTimelinePosts, type TimelineSeed } from '../hooks/useTimelinePosts';
import FeedLoadFeedback from './FeedLoadFeedback';
import type { Post } from '../interfaces/post.interfaces';
import FeedTimelineSkeleton from './FeedTimelineSkeleton';

interface FeedTimelineProps {
  initialPage?: TimelineSeed;
}

export default function FeedTimeline({ initialPage }: FeedTimelineProps = {}) {
  const t = useTranslations('feed.timeline');
  const initialPosts = initialPage?.posts;
  const query = useTimelinePosts(initialPage);
  const posts = query.data;
  const isLoading = posts.length === 0 && query.isLoading;
  const error = query.error;

  // Fetch suggestions only when the friends-feed came back empty.
  const showSuggestions = !isLoading && !error && !query.hasMore && posts.length === 0;
  const suggestionsQuery = useSuggestedPosts({ enabled: showSuggestions });
  const suggestedPosts: Post[] = suggestionsQuery.data ?? [];

  // Activar WebSocket para actualizaciones en tiempo real
  usePostSocketEvents();
  useReactionSocket();

  const { user } = useAuth();
  const seedMyReactions = useReactionStore((s) => s.seedMyReactions);
  const fetchMyReactionsForPosts = useReactionStore((s) => s.fetchMyReactionsForPosts);

  // The RSC already ships `post.currentUserReaction` for every initial post: seed
  // the reaction store from it before paint (layout effect) so the Like buttons
  // don't flash "not liked", and so the bulk fetch below has nothing to query.
  useLayoutEffect(() => {
    if (!user?.id || !initialPosts?.length) return;
    seedMyReactions(
      user.id,
      initialPosts.map((p) => ({ postId: p.id, type: p.currentUserReaction ?? null })),
    );
  }, [user?.id, initialPosts, seedMyReactions]);

  // Bulk-load my reaction for any visible post the seed didn't cover (posts that
  // arrived through a client refetch) in one query; the store skips known ids.
  const visibleIds = posts.length > 0 ? posts.map((p) => p.id).join(',') : '';
  useEffect(() => {
    if (!user?.id || !visibleIds) return;
    void fetchMyReactionsForPosts(visibleIds.split(','));
  }, [user?.id, visibleIds, fetchMyReactionsForPosts]);

  if (error && posts.length === 0) {
    return <FeedLoadFeedback message={t('loadError')} onRetry={query.refetch} pending={query.isFetching} />;
  }

  // Mostrar skeleton mientras carga
  if (isLoading && posts.length === 0) {
    return <FeedTimelineSkeleton />;
  }

  return (
    <div className="space-y-4">
      {error && <FeedLoadFeedback message={t('refreshError')} onRetry={query.refetch} pending={query.isFetching} />}
      {/* Feed de Posts */}
      {posts.length > 0 || query.hasMore ? (
        <>
          {posts.map((post, postIndex) => (
            <PostCard key={post.id} post={post} lcpCandidate={postIndex === 0} />
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
      {query.moreError && <FeedLoadFeedback message={t('moreError')} onRetry={query.loadMore} pending={query.isFetching} />}
      {query.hasMore && !query.moreError && (
        <button
          type="button"
          onClick={() => void query.loadMore()}
          disabled={query.isFetching}
          className="w-full rounded-xl border border-primary-200 bg-white px-4 py-3 font-medium text-primary-800 hover:bg-primary-50 disabled:opacity-60 dark:border-primary-800 dark:bg-neutral-900 dark:text-primary-200"
        >
          {query.isLoadingMore ? t('loadingMore') : t('loadMore')}
        </button>
      )}
      {!query.hasMore && posts.length > 0 && <p className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">{t('end')}</p>}
    </div>
  );
}
