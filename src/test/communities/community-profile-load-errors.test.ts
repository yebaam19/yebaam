import { beforeEach, expect, it, vi } from 'vitest';
import { getCommunityDetailBySlug } from '@/features/communities/server/communities/communities-detail.server';
import { getViewerJoinState } from '@/features/communities/server/communities/communities-members.server';
import { loadCommunityContext } from '@/features/communities/server/communities/_shared';

const mocks = vi.hoisted(() => ({ from: vi.fn(), user: vi.fn() }));
vi.mock('react', () => ({ cache: (fn: unknown) => fn }));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: async () => ({ from: mocks.from }) }));
vi.mock('@/features/auth/actions/auth.actions', () => ({ getCachedAuthUser: () => mocks.user() }));

beforeEach(() => vi.resetAllMocks());

it('reports a failed profile lookup instead of showing the community as missing', async () => {
  mocks.user.mockResolvedValue(null);
  mocks.from.mockReturnValue({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { code: 'PGRST' } }) }) }),
  });

  await expect(getCommunityDetailBySlug('community')).rejects.toThrow('No se pudo cargar la comunidad.');
});

it('reports a failed access lookup instead of silently treating the viewer as a stranger', async () => {
  mocks.user.mockResolvedValue({ id: 'viewer' });
  mocks.from.mockImplementation((table: string) => {
    const query = {
      eq: () => query, order: () => query, limit: () => query,
      maybeSingle: async () => ({ data: null, error: table === 'community_members' ? { code: 'PGRST' } : null }),
    };
    return { select: () => query };
  });

  await expect(getViewerJoinState('community-id')).rejects.toThrow('No se pudo cargar tu acceso a la comunidad.');
});

it('does not render incomplete owner and membership context after a related query fails', async () => {
  mocks.from.mockImplementation((table: string) => {
    const result = { data: [], error: table === 'profiles' ? { code: 'PGRST' } : null };
    const query = {
      in: () => query, eq: () => query,
      then: (resolve: (value: typeof result) => void) => Promise.resolve(result).then(resolve),
    };
    return { select: () => query };
  });

  await expect(loadCommunityContext([{ id: 'community-id', owner_id: 'owner-id' } as never], null))
    .rejects.toThrow('No se pudo cargar la información de la comunidad.');
});
