import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidate } from '@/lib/hooks/cacheStore';
import { useSuggestedCommunities } from '@/features/communities/hooks/useCommunities';
import type { Community, CommunitiesListResponse } from '@/features/communities/types/community.types';

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  auth: { user: null as { id: string } | null, isInitialized: false },
  serverUser: null as { id: string } | null,
}));
vi.mock('@/features/auth/context/auth-context', () => ({ useAuth: () => mocks.auth }));
vi.mock('@/features/auth/context/current-user.context', () => ({ useOptionalCurrentUser: () => mocks.serverUser }));
vi.mock('@/features/auth/store/auth.store', () => ({ useAuthStore: () => mocks.auth.user?.id }));
vi.mock('@/features/communities/services/communities.service', () => ({ communitiesService: { getSuggestedCommunities: mocks.load } }));

const initial = [{ id: 'community-from-server' }] as Community[];
const fresh: CommunitiesListResponse = { success: true, data: [], total: 0, page: 1, limit: 12 };
let sequence = 0;

beforeEach(() => {
  mocks.load.mockReset().mockResolvedValue(fresh);
  mocks.auth = { user: null, isInitialized: false };
  mocks.serverUser = { id: `viewer-${++sequence}` };
});

describe('community suggestion hydration', () => {
  it('reuses server data across hydration and a later sidebar mount', async () => {
    const viewerId = mocks.serverUser!.id;
    const page = renderHook(() => useSuggestedCommunities(12, initial, viewerId));
    expect(page.result.current.data?.data).toEqual(initial);
    expect(mocks.load).not.toHaveBeenCalled();
    mocks.auth = { user: { id: viewerId }, isInitialized: true };
    page.rerender();
    const sidebar = renderHook(() => useSuggestedCommunities(12));
    await waitFor(() => expect(sidebar.result.current.data?.data).toEqual(initial));
    expect(mocks.load).not.toHaveBeenCalled();
  });

  it('does not fetch the authenticated sidebar again when client auth initializes', async () => {
    const sidebar = renderHook(() => useSuggestedCommunities(12));
    await waitFor(() => expect(sidebar.result.current.isFetching).toBe(false));
    expect(mocks.load).toHaveBeenCalledTimes(1);
    mocks.auth = { user: mocks.serverUser, isInitialized: true };
    sidebar.rerender();
    await act(async () => {});
    expect(mocks.load).toHaveBeenCalledTimes(1);
  });

  it('waits for auth initialization without a server session', async () => {
    mocks.serverUser = null;
    const hook = renderHook(() => useSuggestedCommunities(12));
    expect(mocks.load).not.toHaveBeenCalled();
    mocks.auth = { user: { id: 'client-only-viewer' }, isInitialized: true };
    hook.rerender();
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(1));
  });

  it('refetches after invalidation instead of restoring the initial snapshot', async () => {
    const hook = renderHook(() => useSuggestedCommunities(12, initial, mocks.serverUser!.id));
    act(() => invalidate('communities::suggested'));
    await waitFor(() => expect(hook.result.current.data).toEqual(fresh));
    expect(mocks.load).toHaveBeenCalledTimes(1);
  });

  it.each([null, { id: 'another-viewer' }])('does not reuse server data after changing session to %j', async (user) => {
    const ownerId = mocks.serverUser!.id;
    const hook = renderHook(() => useSuggestedCommunities(12, initial, ownerId));
    mocks.load.mockReturnValue(new Promise(() => {}));
    mocks.auth = { user, isInitialized: true };
    hook.rerender();
    expect(hook.result.current.data).toBeNull();
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(1));
  });

  it('treats an empty server result as loaded data', () => {
    const empty: Community[] = [];
    const hook = renderHook(() => useSuggestedCommunities(12, empty, mocks.serverUser!.id));
    expect(hook.result.current.data?.data).toEqual([]);
    expect(mocks.load).not.toHaveBeenCalled();
  });
});
