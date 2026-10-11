import { beforeEach, expect, it, vi } from 'vitest';
import { getCommunityMembers } from '@/features/communities/server/communities/communities-members.server';
import { getCommunityPosts } from '@/features/communities/server/communities/communities-posts.server';

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('react', () => ({ cache: (fn: unknown) => fn }));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: async () => ({ from: mocks.from }) }));

beforeEach(() => vi.resetAllMocks());

it('does not present a failed roster query as an empty community', async () => {
  const ordered = {
    order: () => ordered,
    range: async () => ({ data: null, count: null, error: { code: 'PGRST' } }),
  };
  mocks.from.mockReturnValue({
    select: () => ({ eq: () => ({ eq: () => ({
      order: () => ordered,
    }) }) }),
  });
  await expect(getCommunityMembers('community-id')).rejects.toThrow('No se pudo cargar la lista de miembros.');
});

it('does not present a failed post query as an empty feed', async () => {
  const query = {
    eq: () => query, order: () => query,
    range: async () => ({ data: null, count: null, error: { code: 'PGRST' } }),
  };
  mocks.from.mockReturnValue({ select: () => query });
  await expect(getCommunityPosts('community-id')).rejects.toThrow('No se pudieron cargar las publicaciones.');
});
