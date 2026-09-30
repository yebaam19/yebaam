import { act, renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { invalidate } from '@/lib/hooks/cacheStore';
import type { CommunitiesListResponse } from '../types/community.types';
import { useSuggestedCommunities } from './useCommunities';

const { load } = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('@/features/auth/store/auth.store', () => ({ useAuthStore: () => 'test-viewer' }));
vi.mock('../services/communities.service', () => ({
  communitiesService: { getSuggestedCommunities: load },
}));

it('shares concurrent reads but starts a fresh read after invalidation', async () => {
  let resolveOld!: (value: CommunitiesListResponse) => void;
  let resolveFresh!: (value: CommunitiesListResponse) => void;
  const oldRead = new Promise<CommunitiesListResponse>((resolve) => { resolveOld = resolve; });
  const freshRead = new Promise<CommunitiesListResponse>((resolve) => { resolveFresh = resolve; });
  load.mockReturnValueOnce(oldRead).mockReturnValueOnce(freshRead);
  const first = renderHook(() => useSuggestedCommunities(6));
  const second = renderHook(() => useSuggestedCommunities(6));
  await waitFor(() => expect(load).toHaveBeenCalledTimes(1));

  act(() => invalidate('communities::suggested'));
  await waitFor(() => expect(load).toHaveBeenCalledTimes(2));

  const stale: CommunitiesListResponse = { success: true, data: [], total: 1, page: 1, limit: 6 };
  await act(async () => { resolveOld(stale); await oldRead; });
  expect(first.result.current.data).toBeNull();
  expect(second.result.current.data).toBeNull();

  const third = renderHook(() => useSuggestedCommunities(6));
  expect(load).toHaveBeenCalledTimes(2);
  const fresh = { ...stale, total: 0 };
  await act(async () => { resolveFresh(fresh); await freshRead; });
  await waitFor(() => {
    for (const hook of [first, second, third]) {
      expect(hook.result.current.data).toEqual(fresh);
      expect(hook.result.current.isFetching).toBe(false);
    }
  });
});
