'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getCached, getVersion, setCached, subscribe } from '@/lib/hooks/cacheStore';
import type { Post } from '../interfaces/post.interfaces';
import type { TimelineCursor, TimelinePage } from '../interfaces/timeline.interfaces';
import { fetchTimelinePage } from '../services/timeline.service';

const KEY = 'posts::timeline';
const META_KEY = 'posts::timeline-pagination';
const seededPages = new WeakSet<TimelinePage>();
type Record = { data: Post[]; fetchedAt: number };
type Metadata = { viewerId: string; nextCursor: TimelineCursor | null };
export type TimelineSeed = TimelinePage & { viewerId: string };
const listen = (callback: () => void) => {
  const offPosts = subscribe(KEY, callback);
  const offMetadata = subscribe(META_KEY, callback);
  return () => { offPosts(); offMetadata(); };
};

export function useTimelinePosts(initialPage?: TimelineSeed) {
  const viewerId = useAuthStore((state) => state.user?.id);
  const metadata = useSyncExternalStore(listen, () => getCached<Metadata>(META_KEY), () => undefined);
  const record = useSyncExternalStore(listen, () => getCached<Record>(KEY), () => undefined);
  const version = useSyncExternalStore(listen, () => getVersion(KEY), () => 0);
  const [error, setError] = useState<Error | null>(null);
  const [moreError, setMoreError] = useState<Error | null>(null);
  const [pending, setPending] = useState<'refresh' | 'more' | null>(null);
  const request = useRef<AbortController | null>(null);
  const ownedRecord = viewerId && metadata?.viewerId === viewerId ? record : undefined;
  const seed = !viewerId || initialPage?.viewerId === viewerId ? initialPage : undefined;
  const posts = ownedRecord?.data ?? seed?.posts ?? [];
  const nextCursor = ownedRecord ? metadata?.nextCursor : seed?.nextCursor;

  useLayoutEffect(() => {
    if (!viewerId || !initialPage || initialPage.viewerId !== viewerId || seededPages.has(initialPage)) return;
    request.current?.abort();
    request.current = null;
    setPending(null);
    setError(null);
    setMoreError(null);
    setCached<Metadata>(META_KEY, { viewerId, nextCursor: initialPage.nextCursor });
    setCached<Record>(KEY, { data: initialPage.posts, fetchedAt: Date.now() });
    seededPages.add(initialPage);
  }, [initialPage, viewerId]);

  const run = useCallback(async (append: boolean) => {
    if (!viewerId) return;
    const meta = getCached<Metadata>(META_KEY);
    const cursor = append && meta?.viewerId === viewerId ? meta.nextCursor : null;
    if (append && (!cursor || request.current)) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setPending(append ? 'more' : 'refresh');
    if (append) setMoreError(null);
    try {
      const page = await fetchTimelinePage(cursor, controller.signal);
      if (controller.signal.aborted || useAuthStore.getState().user?.id !== viewerId) return;
      const current = getCached<Record>(KEY)?.data ?? [];
      const ids = new Set(current.map((post) => post.id));
      const data = append ? [...current, ...page.posts.filter((post) => !ids.has(post.id))] : page.posts;
      setCached<Metadata>(META_KEY, { viewerId, nextCursor: page.nextCursor });
      setCached<Record>(KEY, { data, fetchedAt: Date.now() });
      setError(null);
      setMoreError(null);
    } catch (cause) {
      if (controller.signal.aborted || useAuthStore.getState().user?.id !== viewerId) return;
      const failure = cause instanceof Error ? cause : new Error('Unable to load timeline');
      if (append) setMoreError(failure);
      else setError(failure);
    } finally {
      if (request.current === controller) {
        request.current = null;
        setPending(null);
      }
    }
  }, [viewerId]);

  useEffect(() => {
    setError(null);
    setMoreError(null);
    const cached = getCached<Record>(KEY);
    const meta = getCached<Metadata>(META_KEY);
    if (viewerId && (!cached || meta?.viewerId !== viewerId || Date.now() - cached.fetchedAt >= 30_000)) {
      void run(false);
    }
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [viewerId, version, run]);

  return {
    data: posts,
    error,
    moreError,
    isLoading: !ownedRecord && !seed && !error,
    isFetching: pending !== null,
    isLoadingMore: pending === 'more',
    hasMore: Boolean(nextCursor),
    refetch: () => run(false),
    loadMore: () => run(true),
  };
}
