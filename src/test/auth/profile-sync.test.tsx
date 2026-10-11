import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useAuthSync } from '@/features/auth/hooks/useAuthSync';
import { useProfileStore } from '@/features/profile/store/profile.store';
import type { UserProfile } from '@/features/profile/interfaces/profile.interfaces';

const mocks = vi.hoisted(() => ({
  auth: { isAuthenticated: true, user: { id: 'viewer' } },
  getMyProfile: vi.fn(),
}));

vi.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: (selector: (state: typeof mocks.auth) => unknown) => selector(mocks.auth),
}));
vi.mock('@/features/profile/services/profile.service', () => ({
  profileService: { getMyProfile: mocks.getMyProfile },
}));

const visitedProfile = { userId: 'visited', username: 'visited' } as UserProfile;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth = { isAuthenticated: true, user: { id: 'viewer' } };
  mocks.getMyProfile.mockResolvedValue({ userId: 'viewer', username: 'viewer' });
  useProfileStore.getState().reset();
  useProfileStore.setState({ profiles: new Map() });
});

it('does not fetch the full profile again after authentication finishes', async () => {
  const { rerender } = renderHook(({ ready }) => useAuthSync({ authReady: ready }), {
    initialProps: { ready: false },
  });

  await act(async () => rerender({ ready: true }));

  expect(mocks.getMyProfile).not.toHaveBeenCalled();
  expect(useProfileStore.getState().currentProfile).toBeNull();
});

it('keeps the visited profile when authentication finishes', async () => {
  useProfileStore.setState({ currentProfile: visitedProfile });

  await act(async () => { renderHook(() => useAuthSync({ authReady: true })); });

  expect(useProfileStore.getState().currentProfile).toBe(visitedProfile);
});

it('clears the selected profile after logout', () => {
  useProfileStore.setState({
    currentProfile: visitedProfile,
    profiles: new Map([['visited', visitedProfile]]),
  });
  const { rerender } = renderHook(() => useAuthSync({ authReady: true }));

  mocks.auth.isAuthenticated = false;
  rerender();

  expect(useProfileStore.getState().currentProfile).toBeNull();
});

it('waits for authentication before clearing cached profiles', () => {
  mocks.auth.isAuthenticated = false;
  useProfileStore.setState({ currentProfile: visitedProfile });
  const { rerender } = renderHook(({ ready }) => useAuthSync({ authReady: ready }), {
    initialProps: { ready: false },
  });

  expect(useProfileStore.getState().currentProfile).toBe(visitedProfile);
  rerender({ ready: true });
  expect(useProfileStore.getState().currentProfile).toBeNull();
});
