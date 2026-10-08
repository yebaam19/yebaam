import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveCommunityAbout, attachAboutMedia, detachAboutMedia } from '@/features/communities/actions/about/content.actions';

const mocks = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn(), from: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/features/communities/actions/_shared', () => ({ requireSession: mocks.session }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
const communityId = '11111111-1111-4111-8111-111111111111';
const id = '22222222-2222-4222-8222-222222222222';
const assetId = '33333333-3333-4333-8333-333333333333';
function query(data: unknown, error: unknown = null) {
  const result = { insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error }).then(resolve) };
  mocks.from.mockReturnValue(result);
  return result;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ userId: id, client: { rpc: mocks.rpc, from: mocks.from } });
  mocks.rpc.mockResolvedValue({ data: { content: true, plans: false, settings: false }, error: null });
});

describe('About writes', () => {
  it('uses the content grant and defaults new institutional data to private drafts', async () => {
    const write = query({ id, version: 1 });
    const result = await saveCommunityAbout({ communityId, id, mission: '<p onclick="alert(1)">Mission</p><img src="https://invalid.test/x"><script>x()</script>' });
    expect(result.ok).toBe(true);
    expect(write.insert).toHaveBeenCalledWith(expect.objectContaining({ id, community_id: communityId, mission: '<p>Mission</p>', is_published: false }));
    expect(mocks.revalidate).toHaveBeenCalledWith('/feed/comunidades/[slug]', 'layout');
  });
  it('rejects malformed links, dates and byte-heavy text before constructing a session', async () => {
    for (const patch of [{ website: 'javascript:alert(1)' }, { website: 'https://user:pass@example.test' },
      { foundedOn: '2026-02-31' }, { history: '🙂'.repeat(13000) }, { socialLinks: Array(11).fill({ label: 'Web', url: 'https://example.test' }) }]) {
      expect((await saveCommunityAbout({ communityId, id, ...patch })).ok).toBe(false);
    }
    expect(mocks.session).not.toHaveBeenCalled();
  });
  it('requires a verified session and fails closed on permission failures', async () => {
    mocks.session.mockResolvedValueOnce(null);
    expect((await saveCommunityAbout({ communityId, id })).ok).toBe(false);
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '503' } });
    expect((await saveCommunityAbout({ communityId, id })).ok).toBe(false);
    mocks.rpc.mockResolvedValueOnce({ data: { content: false, plans: true }, error: null });
    expect((await saveCommunityAbout({ communityId, id })).ok).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('scopes optimistic updates and reports conflicts without revalidation', async () => {
    const write = query(null);
    expect(await saveCommunityAbout({ communityId, id, expectedVersion: 3 })).toEqual({ ok: false, error: expect.stringContaining('cambió') });
    expect(write.eq.mock.calls).toEqual([['community_id', communityId], ['id', id], ['version', 3]]);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it('returns the existing link identity after an idempotent attach', async () => {
    const write = query({ id: assetId });
    expect(await attachAboutMedia({ communityId, id, aboutId: id, assetId })).toEqual({ ok: true, data: { id: assetId } });
    expect(write.upsert).toHaveBeenCalledWith({ community_id: communityId, id, about_id: id, asset_id: assetId },
      { onConflict: 'about_id,asset_id', ignoreDuplicates: true });
  });
  it('only unlinks with explicit confirmation and never deletes the library asset', async () => {
    const write = query(null);
    expect((await detachAboutMedia({ communityId, id, aboutId: id, assetId })).ok).toBe(false);
    expect(write.delete).not.toHaveBeenCalled();
    expect((await detachAboutMedia({ communityId, id, aboutId: id, assetId, confirmed: true })).ok).toBe(true);
    expect(mocks.from).toHaveBeenCalledWith('community_about_media');
    expect(write.eq.mock.calls).toEqual([['community_id', communityId], ['about_id', id], ['asset_id', assetId], ['id', id]]);
  });
});
