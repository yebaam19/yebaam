import { beforeEach, describe, expect, it, vi } from 'vitest';

const { from, query, getUser, caches } = vi.hoisted(() => ({
  from: vi.fn(), getUser: vi.fn(), caches: [] as Map<string, unknown>[],
  query: { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() },
}));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: async () => ({ from }) }));
vi.mock('@/features/auth/actions/auth.actions', () => ({ getCachedAuthUser: getUser }));
vi.mock('react', () => ({
  cache: (fn: (...args: unknown[]) => unknown) => {
    const values = new Map<string, unknown>();
    caches.push(values);
    return (...args: unknown[]) => {
      const key = JSON.stringify(args);
      if (!values.has(key)) values.set(key, fn(...args));
      return values.get(key);
    };
  },
}));

import { getViewerJoinStatus, getViewerRoleInClub } from './permissions.server';

beforeEach(() => {
  vi.clearAllMocks();
  caches.forEach((cache) => cache.clear());
  getUser.mockResolvedValue({ id: 'viewer' });
  from.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
});

describe('request-scoped club membership', () => {
  it('deduplicates role and join-status readers for the same club/viewer', async () => {
    query.maybeSingle.mockResolvedValue({ data: { role: 'ADMIN', status: 'approved' } });
    expect(await Promise.all([getViewerRoleInClub('club'), getViewerJoinStatus('club')]))
      .toEqual(['ADMIN', { kind: 'approved', role: 'ADMIN' }]);
    expect(from).toHaveBeenCalledExactlyOnceWith('club_members');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'viewer');
    expect(query.eq).toHaveBeenCalledWith('club_id', 'club');
  });

  it('does not query memberships for signed-out viewers', async () => {
    getUser.mockResolvedValue(null);
    expect(await getViewerRoleInClub('club')).toBeNull();
    expect(await getViewerJoinStatus('club')).toEqual({ kind: 'signed_out' });
    expect(from).not.toHaveBeenCalled();
  });

  it('preserves pending membership without granting a role', async () => {
    query.maybeSingle.mockResolvedValue({ data: { role: 'MEMBER', status: 'pending' } });
    expect(await getViewerRoleInClub('club')).toBeNull();
    expect(await getViewerJoinStatus('club')).toEqual({ kind: 'pending' });
    expect(from).toHaveBeenCalledTimes(1);
  });

  it('preserves missing membership handling', async () => {
    query.maybeSingle.mockResolvedValue({ data: null });
    expect(await getViewerRoleInClub('club')).toBeNull();
    expect(await getViewerJoinStatus('club')).toEqual({ kind: 'none' });
  });

  it('keeps different clubs and subsequent request scopes separate', async () => {
    query.maybeSingle.mockResolvedValue({ data: { role: 'MEMBER', status: 'approved' } });
    await getViewerRoleInClub('first');
    await getViewerJoinStatus('second');
    expect(from).toHaveBeenCalledTimes(2);
    caches.forEach((cache) => cache.clear());
    getUser.mockResolvedValue({ id: 'another-viewer' });
    query.maybeSingle.mockResolvedValue({ data: null });
    expect(await getViewerJoinStatus('first')).toEqual({ kind: 'none' });
    expect(query.eq).toHaveBeenCalledWith('user_id', 'another-viewer');
  });
});
