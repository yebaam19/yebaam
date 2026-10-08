import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMoreCommunityRoles, revokeCommunityRole, saveCommunityRole } from '@/features/communities/actions/communityRoles.actions';

const mocks = vi.hoisted(() => ({ owner: vi.fn(), grants: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/features/communities/server/community-roles.server', () => ({
  requireCommunityOwner: mocks.owner,
  getCommunityRoleGrants: mocks.grants,
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));

const communityId = '22222222-2222-4222-8222-222222222222';
const ownerId = '11111111-1111-4111-8111-111111111111';
const memberId = '33333333-3333-4333-8333-333333333333';

function query(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue(result),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.owner.mockResolvedValue({ ok: false, error: 'Solo el propietario puede gestionar los roles.' });
});

describe('community role actions', () => {
  it('rejects unauthorized writes before opening a table', async () => {
    const input = { communityId, userId: memberId, role: 'editor' };
    expect((await saveCommunityRole(input)).ok).toBe(false);
    expect((await revokeCommunityRole({ communityId, userId: memberId })).ok).toBe(false);
    expect(mocks.owner).toHaveBeenCalledTimes(2);
  });

  it('requires active membership and writes only the validated grant', async () => {
    const member = query({ data: { user_id: memberId }, error: null });
    const saved = query({ data: { user_id: memberId }, error: null });
    const upsert = vi.fn().mockReturnValue(saved);
    const from = vi.fn((table: string) => {
      if (table === 'community_members') return member;
      if (table === 'community_profile_roles') return { upsert };
      throw new Error(`Unexpected table: ${table}`);
    });
    mocks.owner.mockResolvedValue({ ok: true, session: { userId: ownerId, client: { from } }, slug: 'test' });

    const input = { communityId, userId: memberId, role: 'editor', canEditPlans: true, ownerId };
    expect((await saveCommunityRole(input)).ok).toBe(true);
    expect(upsert).toHaveBeenCalledWith({
      community_id: communityId, user_id: memberId, role: 'editor', can_edit_plans: true,
    }, { onConflict: 'community_id,user_id' });
    expect(upsert.mock.calls[0][0]).not.toHaveProperty('ownerId');
    expect(mocks.revalidate).toHaveBeenCalledWith('/feed/comunidades/test', 'layout');

    member.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    expect((await saveCommunityRole(input)).ok).toBe(false);
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed role cursors without a database read', async () => {
    expect((await getMoreCommunityRoles({ communityId, cursor: '{bad' })).ok).toBe(false);
    expect(mocks.grants).not.toHaveBeenCalled();
  });
});
