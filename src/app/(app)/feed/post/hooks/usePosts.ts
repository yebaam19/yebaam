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

function timelineUpdater(updater: (prev: Post[] | undefined) => Post[]) {
  updateCached<CachedRecord<Post[]>>(TIMELINE_KEY, (record) => ({
    data: updater(record?.data),
    fetchedAt: Date.now(),
  }));
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
