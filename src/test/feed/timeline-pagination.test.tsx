import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import { useTimelinePosts } from '@/app/(app)/feed/post/hooks/useTimelinePosts';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { clearCached, invalidate, updateCached } from '@/lib/hooks/cacheStore';
import { fetchTimelinePage } from '@/app/(app)/feed/post/services/timeline.service';
import type { TimelinePage } from '@/app/(app)/feed/post/interfaces/timeline.interfaces';
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces';

vi.mock('@/features/auth/store/auth.store', () => ({ useAuthStore: create(() => ({ user: { id: 'viewer' } })) }));
vi.mock('@/app/(app)/feed/post/services/timeline.service', () => ({ fetchTimelinePage: vi.fn() }));
const fetchPage = vi.mocked(fetchTimelinePage);
const cursor = { createdAt: '2026-10-11T00:00:00.000Z', id: 'last' };
const post = (id: string) => ({ id }) as Post;
const seed = () => ({ viewerId: 'viewer', posts: Array.from({ length: 20 }, (_, i) => post(String(i))), nextCursor: cursor });

beforeEach(() => {
  vi.clearAllMocks();
  clearCached('posts::timeline');
  clearCached('posts::timeline-pagination');
  useAuthStore.setState({ user: { id: 'viewer' } as never });
  fetchPage.mockResolvedValue({ posts: [], nextCursor: null });
});

it('loads beyond 20, deduplicates overlapping rows and preserves locally added posts', async () => {
  const initialPage = seed();
  const hook = renderHook(() => useTimelinePosts(initialPage));
  expect(fetchPage).not.toHaveBeenCalled();
  fetchPage.mockResolvedValueOnce({ posts: [post('19'), post('20'), post('21')], nextCursor: null });
  act(() => updateCached<{ data: Post[]; fetchedAt: number }>('posts::timeline', (record) => ({
    data: [post('new'), ...record!.data], fetchedAt: Date.now(),
  })));
  await act(() => hook.result.current.loadMore());
  expect(fetchPage).toHaveBeenCalledWith(cursor, expect.any(AbortSignal));
  expect(hook.result.current.data.map((p) => p.id)).toEqual(['new', ...Array.from({ length: 22 }, (_, i) => String(i))]);
  expect(hook.result.current.hasMore).toBe(false);
});

it('retains loaded posts and the cursor after a page failure and retries the same page', async () => {
  const initialPage = seed();
  const hook = renderHook(() => useTimelinePosts(initialPage));
  fetchPage.mockRejectedValueOnce(new Error('offline'));
  await act(() => hook.result.current.loadMore());
  expect(hook.result.current.data).toHaveLength(20);
  expect(hook.result.current.moreError?.message).toBe('offline');
  expect(hook.result.current.hasMore).toBe(true);
  fetchPage.mockResolvedValueOnce({ posts: [post('20')], nextCursor: null });
  await act(() => hook.result.current.loadMore());
  expect(hook.result.current.data).toHaveLength(21);
  expect(hook.result.current.moreError).toBeNull();
  expect(fetchPage.mock.calls.every(([value]) => value === cursor)).toBe(true);
});

it('keeps cached content on revalidation failure and recovers on retry', async () => {
  const initialPage = seed();
  const hook = renderHook(() => useTimelinePosts(initialPage));
  fetchPage.mockRejectedValueOnce(new Error('offline'));
  act(() => invalidate('posts'));
  await waitFor(() => expect(hook.result.current.error?.message).toBe('offline'));
  expect(hook.result.current.data).toHaveLength(20);
  fetchPage.mockResolvedValueOnce({ posts: [post('fresh')], nextCursor: null });
  await act(() => hook.result.current.refetch());
  expect(hook.result.current.error).toBeNull();
  expect(hook.result.current.data[0].id).toBe('fresh');
});

it('continues after a fully filtered page rather than treating it as the end', async () => {
  const initialPage = { viewerId: 'viewer', posts: [], nextCursor: cursor };
  const hook = renderHook(() => useTimelinePosts(initialPage));
  expect(hook.result.current.hasMore).toBe(true);
  fetchPage.mockResolvedValueOnce({ posts: [post('visible')], nextCursor: null });
  await act(() => hook.result.current.loadMore());
  expect(hook.result.current.data[0].id).toBe('visible');
});

it('coalesces double clicks and ignores a previous-account response', async () => {
  const initialPage = seed();
  let resolve!: (page: TimelinePage) => void;
  fetchPage.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  const hook = renderHook(() => useTimelinePosts(initialPage));
  let pending!: Promise<void>;
  act(() => { pending = hook.result.current.loadMore(); void hook.result.current.loadMore(); });
  expect(fetchPage).toHaveBeenCalledTimes(1);
  act(() => useAuthStore.setState({ user: { id: 'other' } as never }));
  await act(async () => { resolve({ posts: [post('private-old')], nextCursor: null }); await pending; });
  expect(hook.result.current.data).toEqual([]);
});

it('discards an older pagination response when a fresh server page replaces the feed', async () => {
  let resolve!: (page: TimelinePage) => void;
  fetchPage.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  const hook = renderHook(({ initial }) => useTimelinePosts(initial), { initialProps: { initial: seed() } });
  let pending!: Promise<void>;
  act(() => { pending = hook.result.current.loadMore(); });
  hook.rerender({ initial: { ...seed(), posts: [post('new-server-page')] } });
  await act(async () => { resolve({ posts: [post('old-page')], nextCursor: null }); await pending; });
  expect(hook.result.current.data.map((p) => p.id)).toEqual(['new-server-page']);
  expect(hook.result.current.hasMore).toBe(true);
  expect(hook.result.current.isFetching).toBe(false);
});
