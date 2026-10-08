import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveCommunityLeader, saveLeaderCategory, deleteCommunityLeader, deleteLeaderCategory } from '@/features/communities/actions/leaders/content.actions';
import { saveLeaderContacts, saveLeaderMedia, detachLeaderMedia } from '@/features/communities/actions/leaders/details.actions';
const mocks = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn(), from: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/features/communities/actions/_shared', () => ({ requireSession: mocks.session }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
const communityId = '11111111-1111-4111-8111-111111111111';
const id = '22222222-2222-4222-8222-222222222222';
const sectionId = '33333333-3333-4333-8333-333333333333';
function query(data: unknown, error: unknown = null) {
  return { insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data, error }) };
}
beforeEach(() => {
  vi.resetAllMocks(); mocks.session.mockResolvedValue({ userId: id, client: { rpc: mocks.rpc, from: mocks.from } });
  mocks.rpc.mockResolvedValue({ data: { content: true, plans: false }, error: null });
});
describe('Directory writes', () => {
  it('allows content editors, sanitizes rich fields and defaults records to hidden', async () => {
    const q = query({ id, version: 1 }); mocks.from.mockReturnValue(q);
    expect((await saveCommunityLeader({ communityId, sectionId, id, fullName: ' Leader ', biography: '<p onclick="bad()">Bio</p><script>bad()</script>', trajectory: '<iframe src="https://example.test"></iframe>' })).ok).toBe(true);
    expect(q.insert).toHaveBeenCalledWith(expect.objectContaining({ full_name: 'Leader', biography: '<p>Bio</p>', trajectory: '', is_published: false, category_id: null }));
    await saveLeaderCategory({ communityId, sectionId, id, title: 'Team' });
    expect(q.insert).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Team', is_published: false }));
  });
  it('validates scope, byte bounds, positions and explicit confirmation before auth', async () => {
    for (const patch of [{ communityId: 'bad' }, { biography: '🙂'.repeat(13000) }, { position: -1 }, { categoryId: 'bad' }]) {
      expect((await saveCommunityLeader({ communityId, sectionId, id, fullName: 'Leader', ...patch })).ok).toBe(false);
    }
    expect((await deleteCommunityLeader({ communityId, id, expectedVersion: 1 })).ok).toBe(false);
    expect(mocks.session).not.toHaveBeenCalled();
  });
  it('fails closed without content permission or a verified session', async () => {
    mocks.session.mockResolvedValueOnce(null);
    expect((await saveLeaderCategory({ communityId, sectionId, id, title: 'Team' })).ok).toBe(false);
    mocks.rpc.mockResolvedValueOnce({ data: { content: false, plans: true }, error: null });
    expect((await saveCommunityLeader({ communityId, sectionId, id, fullName: 'Leader' })).ok).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('checks optimistic versions and reports conflicts without revalidating', async () => {
    const q = query(null); mocks.from.mockReturnValue(q);
    expect(await saveCommunityLeader({ communityId, sectionId, id, fullName: 'Leader', expectedVersion: 3 })).toEqual({ ok: false, error: expect.stringContaining('cambió') });
    expect(q.eq.mock.calls).toEqual([['community_id', communityId], ['id', id], ['version', 3]]);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it('keeps contact publication independent and resolves exact usernames through the caller', async () => {
    const profile = query({ id: sectionId }); const write = query({ id, version: 1 });
    mocks.from.mockReturnValueOnce(profile).mockReturnValue(write);
    expect((await saveLeaderContacts({ communityId, id, email: 'contact@example.test', profileUsername: 'exact-user' })).ok).toBe(true);
    expect(profile.eq).toHaveBeenCalledWith('username', 'exact-user');
    expect(write.insert).toHaveBeenCalledWith(expect.objectContaining({ profile_id: sectionId, is_public: false }));
    mocks.from.mockReturnValue(query(null));
    expect(await saveLeaderContacts({ communityId, id, profileUsername: 'hidden-user' })).toEqual({ ok: false, error: expect.stringContaining('no está disponible') });
  });
  it('replaces only the scoped versioned media slot and unlinks without deleting library media', async () => {
    const q = query({ id, version: 2 }); mocks.from.mockReturnValue(q);
    await saveLeaderMedia({ communityId, id, leaderId: sectionId, slot: 'portrait', assetId: sectionId, expectedVersion: 1 });
    expect(q.update).toHaveBeenCalledWith({ leader_id: sectionId, slot: 'portrait', asset_id: sectionId });
    await detachLeaderMedia({ communityId, id, expectedVersion: 2, confirmed: true });
    expect(mocks.from.mock.calls.every(([table]) => table === 'community_leader_media')).toBe(true);
    expect(q.eq).toHaveBeenCalledWith('version', 2);
  });
  it('explains a nonempty category and requires a version when deleting', async () => {
    mocks.from.mockReturnValue(query(null, { code: '23503' }));
    expect(await deleteLeaderCategory({ communityId, id, expectedVersion: 2, confirmed: true })).toEqual({ ok: false, error: expect.stringContaining('Mueve los integrantes') });
    expect((await deleteCommunityLeader({ communityId, id, confirmed: true })).ok).toBe(false);
  });
});
