import { beforeEach, describe, expect, it, vi } from 'vitest';
import { joinCommunity } from '@/features/communities/actions/members.actions';
import { addCommunityMemberByUsernameAction } from '@/features/communities/actions/moderation.actions';

const mocks = vi.hoisted(() => ({
  getClient: vi.fn(), getServiceClient: vi.fn(), requireUserId: vi.fn(), revalidate: vi.fn(), owner: vi.fn(),
}));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: mocks.getClient, getServiceClient: mocks.getServiceClient }));
vi.mock('@/features/communities/server/community-roles.server', () => ({ requireCommunityOwner: mocks.owner }));
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
  mocks.owner.mockResolvedValue({ ok: false, error: 'Solo el propietario puede gestionar los roles.' });
});

describe('direct community admission', () => {
  it('rejects a malformed community id before checking permissions', async () => {
    expect((await addCommunityMemberByUsernameAction('invalid', 'persona')).ok).toBe(false);
    expect(mocks.owner).not.toHaveBeenCalled();
    expect(mocks.getServiceClient).not.toHaveBeenCalled();
  });

  it('denies a delegated admin before a service-role write', async () => {
    expect(await addCommunityMemberByUsernameAction(communityId, 'persona')).toEqual({
      ok: false, error: 'Solo el propietario puede gestionar los roles.',
    });
    expect(mocks.getServiceClient).not.toHaveBeenCalled();
  });

  it('lets the verified owner add an existing non-member', async () => {
    const profile = query({ data: { id: '33333333-3333-4333-8333-333333333333', username: 'persona' }, error: null });
    const members = query({ data: null, error: null });
    const ownerFrom = vi.fn((table: string) => {
      if (table === 'profiles') return { select: () => ({ ilike: () => ({ maybeSingle: profile.maybeSingle }) }) };
      if (table === 'community_members') return members;
      throw new Error(`Unexpected table: ${table}`);
    });
    mocks.owner.mockResolvedValue({ ok: true, session: { userId: actorId, client: { from: ownerFrom } }, slug: 'test' });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const serviceFrom = vi.fn().mockReturnValue({ insert });
    mocks.getServiceClient.mockReturnValue({ from: serviceFrom });

    expect(await addCommunityMemberByUsernameAction(communityId, '@persona')).toEqual({
      ok: true, data: { user: { id: '33333333-3333-4333-8333-333333333333', username: 'persona' } },
    });
    expect(insert).toHaveBeenCalledWith({
      community_id: communityId, user_id: '33333333-3333-4333-8333-333333333333', role: 'MEMBER', status: 'active',
    });
    expect(mocks.revalidate).toHaveBeenCalledWith('test');
  });
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
