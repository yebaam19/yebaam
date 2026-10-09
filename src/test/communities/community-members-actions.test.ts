import { beforeEach, describe, expect, it, vi } from 'vitest';
import { joinCommunity } from '@/features/communities/actions/members.actions';

const mocks = vi.hoisted(() => ({
  getClient: vi.fn(), requireUserId: vi.fn(), revalidate: vi.fn(),
}));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: mocks.getClient }));
vi.mock('@/features/communities/actions/_shared', () => ({
  requireUserId: mocks.requireUserId,
  revalidateCommunityPaths: mocks.revalidate,
}));

const communityId = '22222222-2222-4222-8222-222222222222';
const actorId = '11111111-1111-4111-8111-111111111111';

function query(result: { data: unknown; error: unknown }) {
  const chain = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue(result) };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireUserId.mockResolvedValue(actorId);
});

describe('community admission action', () => {
  it('accepts a secret invitation even though RLS hides the community before joining', async () => {
    const firstRead = query({ data: null, error: null });
    const afterAdmission = query({ data: { slug: 'invitada' }, error: null });
    const rpc = vi.fn().mockResolvedValue({ data: communityId, error: null });
    const from = vi.fn().mockReturnValueOnce(firstRead).mockReturnValueOnce(afterAdmission);
    mocks.getClient.mockResolvedValue({ from, rpc });

    expect(await joinCommunity(communityId)).toEqual({
      ok: true, data: { id: communityId, outcome: 'invited_join' },
    });
    expect(rpc).toHaveBeenCalledWith('accept_community_invitation', { target_community: communityId });
    expect(from).toHaveBeenCalledTimes(2);
    expect(mocks.revalidate).toHaveBeenCalledWith('invitada');
  });

  it('does not admit a user without a pending invitation', async () => {
    const from = vi.fn().mockReturnValue(query({ data: null, error: null }));
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'Pending invitation required' } });
    mocks.getClient.mockResolvedValue({ from, rpc });

    expect(await joinCommunity(communityId)).toEqual({
      ok: false, error: 'Comunidad no encontrada o invitación inválida.',
    });
    expect(from).toHaveBeenCalledTimes(1);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it('does not report a banned membership as active', async () => {
    const community = query({ data: {
      id: communityId, slug: 'restringida', privacy: 'PUBLIC', owner_id: 'other',
    }, error: null });
    const member = query({ data: { status: 'banned' }, error: null });
    const from = vi.fn().mockReturnValueOnce(community).mockReturnValueOnce(member);
    const rpc = vi.fn();
    mocks.getClient.mockResolvedValue({ from, rpc });

    expect((await joinCommunity(communityId)).ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
    expect(from).toHaveBeenCalledTimes(2);
  });
});
