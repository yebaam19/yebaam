import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteCommunity } from '@/features/communities/actions/update.actions';

const mocks = vi.hoisted(() => ({ owner: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/features/communities/server/community-roles.server', () => ({ requireCommunityOwner: mocks.owner }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));

const communityId = '22222222-2222-4222-8222-222222222222';

function ownerWithDelete(result: { data: { id: string } | null; error: null | { message: string } }) {
  const chain = {
    delete: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn().mockResolvedValue(result),
  };
  chain.delete.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  const from = vi.fn().mockReturnValue(chain);
  mocks.owner.mockResolvedValue({ ok: true, slug: 'comunidad-test', session: { client: { from } } });
  return { chain, from };
}

beforeEach(() => { vi.resetAllMocks(); });

describe('deleteCommunity', () => {
  it('rejects malformed IDs and non-owners before deleting', async () => {
    expect((await deleteCommunity('invalid')).ok).toBe(false);
    expect(mocks.owner).not.toHaveBeenCalled();
    mocks.owner.mockResolvedValue({ ok: false, error: 'Solo el propietario puede gestionar los roles.' });
    expect((await deleteCommunity(communityId)).ok).toBe(false);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it('does not report success when RLS deletes zero rows', async () => {
    const { chain } = ownerWithDelete({ data: null, error: null });
    expect((await deleteCommunity(communityId)).ok).toBe(false);
    expect(chain.eq).toHaveBeenCalledWith('id', communityId);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it('reports and revalidates a confirmed deletion', async () => {
    ownerWithDelete({ data: { id: communityId }, error: null });
    expect(await deleteCommunity(communityId)).toEqual({ ok: true, data: { id: communityId } });
    expect(mocks.revalidate).toHaveBeenCalledWith('/feed/comunidades');
    expect(mocks.revalidate).toHaveBeenCalledWith('/feed/comunidades/comunidad-test');
  });
});
