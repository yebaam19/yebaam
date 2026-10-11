import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLinkPreview } from '@/lib/hooks/useLinkPreview';

const mocks = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null, isInitialized: false },
  serverUser: null as { id: string } | null,
}));
vi.mock('@/features/auth/context/auth-context', () => ({ useAuth: () => mocks.auth }));
vi.mock('@/features/auth/context/current-user.context', () => ({ useOptionalCurrentUser: () => mocks.serverUser }));
let sequence = 0;
beforeEach(() => {
  mocks.auth = { user: null, isInitialized: false };
  mocks.serverUser = { id: `viewer-${++sequence}` };
});

describe('viewer-bound link previews', () => {
  it.each(['pet', 'article'])('loads %s once across completed auth hydration', async (kind) => {
    const load = vi.fn().mockResolvedValue({ title: kind });
    const hook = renderHook(() => useLinkPreview(`${kind}:example`, load));
    await waitFor(() => expect(hook.result.current).toEqual({ title: kind }));
    mocks.auth = { user: mocks.serverUser, isInitialized: true };
    hook.rerender();
    await act(async () => {});
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('waits for identity before requesting a client-only preview', async () => {
    mocks.serverUser = null;
    const load = vi.fn().mockResolvedValue(null);
    const hook = renderHook(() => useLinkPreview('waiting', load));
    expect(load).not.toHaveBeenCalled();
    mocks.auth = { user: null, isInitialized: true };
    hook.rerender();
    await waitFor(() => expect(hook.result.current).toBeNull());
    expect(load).toHaveBeenCalledTimes(1);
  });

  it.each([null, { id: 'another-viewer' }])('hides an old private result immediately on session change: %j', async (user) => {
    const load = vi.fn().mockResolvedValue({ title: 'private' });
    const hook = renderHook(() => useLinkPreview('session-change', load));
    await waitFor(() => expect(hook.result.current).toEqual({ title: 'private' }));
    load.mockReturnValue(new Promise(() => {}));
    mocks.auth = { user, isInitialized: true };
    hook.rerender();
    expect(hook.result.current).toBe('loading');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('coalesces overlapping reads for the same viewer and link', async () => {
    let resolve!: (value: { title: string }) => void;
    const load = vi.fn(() => new Promise<{ title: string }>((done) => { resolve = done; }));
    const first = renderHook(() => useLinkPreview('shared', load));
    const second = renderHook(() => useLinkPreview('shared', load));
    expect(load).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ title: 'shared' }));
    expect(first.result.current).toEqual({ title: 'shared' });
    expect(second.result.current).toEqual({ title: 'shared' });
  });

  it('uses the error state when a request fails', async () => {
    const load = vi.fn().mockRejectedValue(new Error('offline'));
    const hook = renderHook(() => useLinkPreview('failure', load));
    await waitFor(() => expect(hook.result.current).toBe('error'));
  });
});
