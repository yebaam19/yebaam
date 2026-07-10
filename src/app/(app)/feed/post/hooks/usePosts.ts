'use client';

import { useCallback } from 'react';
import { postService } from '../services/post.service';
import type { Post, UpdatePostDTO } from '../interfaces/post.interfaces';
import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import {
  cacheKey,
  invalidate,
  setCached,
  updateCached,
} from '@/lib/hooks/cacheStore';

const TIMELINE_KEY = 'posts::timeline';
const POSTS_PREFIX = 'posts';

type CachedRecord<T> = { data: T; fetchedAt: number };

/** Mirrors a list mutation into any posts-list cache entry (timeline, business wall, etc.). */
function postListUpdater(key: string, updater: (prev: Post[] | undefined) => Post[]) {
  updateCached<CachedRecord<Post[]>>(key, (record) => ({
    data: updater(record?.data),
    fetchedAt: Date.now(),
  }));
}

function timelineUpdater(updater: (prev: Post[] | undefined) => Post[]) {
  postListUpdater(TIMELINE_KEY, updater);
}

export function businessPostsCacheKey(businessId: string): string {
  return cacheKey('posts', 'business', businessId);
}

/** Mirrors a list mutation into one business's wall cache. Plain function (not a hook) so
 *  it can be called from the Zustand mutations slice, which isn't a component. */
export function businessPostsUpdater(businessId: string, updater: (prev: Post[] | undefined) => Post[]) {
  postListUpdater(businessPostsCacheKey(businessId), updater);
}

export function usePost(postId: string, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && Boolean(postId);
  return useFetch<Post>(
    ['posts', postId],
    () => postService.getById(postId),
    { enabled, staleTime: 30_000 }
  );
}

export function usePosts(options?: { enabled?: boolean }) {
  return useFetch<Post[]>(
    ['posts', 'timeline'],
    () => postService.getAll({ limit: 20 }),
    { enabled: options?.enabled ?? true, staleTime: 30_000 }
  );
}

export function useSuggestedPosts(options?: { enabled?: boolean }) {
  return useFetch<Post[]>(
    ['posts', 'suggestions'],
    () => postService.getSuggestedPosts({ limit: 10 }),
    { enabled: options?.enabled ?? true, staleTime: 60_000 }
  );
}

/**
 * Posts wall for one business — same cache-store mechanism as `usePosts()`.
 * `createPost` (mutations.slice.ts) mirrors new business posts into this same
 * cache entry, so any component using this hook re-renders immediately,
 * with no extra wiring on the caller's side.
 */
export function useBusinessPosts(businessId: string, options?: { enabled?: boolean }) {
  return useFetch<Post[]>(
    ['posts', 'business', businessId],
    () => postService.getBusinessPosts(businessId, { limit: 20 }),
    { enabled: (options?.enabled ?? true) && Boolean(businessId), staleTime: 15_000 }
  );
}

export function useUpdatePost() {
  return useAsyncAction(
    async ({ postId, data }: { postId: string; data: UpdatePostDTO }) => {
      return postService.update(postId, data);
    },
    {
      onSuccess: (updatedPost, { postId }) => {
        setCached<CachedRecord<Post>>(cacheKey('posts', postId), {
          data: updatedPost,
          fetchedAt: Date.now(),
        });
        timelineUpdater((posts) => {
          if (!posts) return [updatedPost];
          return posts.map((p) => (p.id === updatedPost.id ? updatedPost : p));
        });
      },
    }
  );
}

export function useInvalidatePosts() {
  return useCallback(() => {
    invalidate(POSTS_PREFIX);
  }, []);
}

export function useAddPostToCache() {
  return useCallback((newPost: Post) => {
    timelineUpdater((posts) => (posts ? [newPost, ...posts] : [newPost]));
  }, []);
}

export function useRemovePostFromCache() {
  return useCallback((postId: string) => {
    timelineUpdater((posts) => (posts ? posts.filter((p) => p.id !== postId) : []));
  }, []);
}

export function useUpdatePostInCache() {
  return useCallback((updatedPost: Post) => {
    timelineUpdater((posts) => {
      if (!posts) return [updatedPost];
      return posts.map((p) => (p.id === updatedPost.id ? updatedPost : p));
    });
  }, []);
}
