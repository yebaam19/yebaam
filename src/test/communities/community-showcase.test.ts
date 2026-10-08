import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveCommunityShowcase } from '@/features/communities/actions/showcase.actions';
import { getCommunityShowcase } from '@/features/communities/server/community-showcase.server';
const mocks = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn(), from: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/features/communities/actions/_shared', () => ({ requireSession: mocks.session }));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: async () => ({ from: mocks.from }) }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('react', () => ({ cache: (fn: unknown) => fn }));
const communityId = '11111111-1111-4111-8111-111111111111';
const video1 = '22222222-2222-4222-8222-222222222222';
const video2 = '33333333-3333-4333-8333-333333333333';
const payload = { communityId, expectedVersion: 0, introduction: ' Welcome ', videoAssetIds: [video1] };
function reader(data: unknown, error: unknown = null) {
  const q = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data, error }) };
  mocks.from.mockReturnValue(q); return q;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ userId: video1, client: { rpc: mocks.rpc } });
  mocks.rpc.mockImplementation(async (name: string) => ({ data: name === 'community_profile_capabilities' ? { content: true } : 1, error: null }));
});
describe('Community showcase', () => {
  it('saves introduction, order and publication together through the verified content capability', async () => {
    expect(await saveCommunityShowcase(payload)).toEqual({ ok: true, data: { version: 1 } });
    expect(mocks.rpc).toHaveBeenLastCalledWith('save_community_showcase', {
      target_community: communityId, expected_version: 0, introduction_text: 'Welcome',
      publish_showcase: false, video_assets: [video1],
    });
    expect(mocks.revalidate).toHaveBeenCalledWith('/feed/comunidades/[slug]', 'layout');
  });
  it('rejects invalid scope, duplicates, more than four videos and oversized introductions before auth', async () => {
    for (const patch of [{ communityId: 'bad' }, { videoAssetIds: [video1, video1] },
      { videoAssetIds: Array.from({ length: 5 }, () => crypto.randomUUID()) },
      { introduction: 'x'.repeat(1201) }, { expectedVersion: -1 }, { videoAssetIds: [null] }]) {
      expect((await saveCommunityShowcase({ ...payload, ...patch })).ok).toBe(false);
    }
    expect(mocks.session).not.toHaveBeenCalled();
  });
  it('fails closed for anonymous users, permission errors and editors without content permission', async () => {
    mocks.session.mockResolvedValueOnce(null);
    expect((await saveCommunityShowcase(payload)).ok).toBe(false);
    mocks.rpc.mockResolvedValueOnce({ data: { plans: true, content: false }, error: null });
    expect((await saveCommunityShowcase(payload)).ok).toBe(false);
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'unavailable' } });
    expect((await saveCommunityShowcase(payload)).ok).toBe(false);
    expect(mocks.rpc.mock.calls.some(([name]) => name === 'save_community_showcase')).toBe(false);
  });
  it('preserves conflicts and unavailable video errors without cache invalidation', async () => {
    mocks.rpc.mockImplementation(async (name: string) => name === 'community_profile_capabilities'
      ? { data: { content: true }, error: null } : { data: null, error: { code: '40001' } });
    expect(await saveCommunityShowcase(payload)).toEqual({ ok: false, error: expect.stringContaining('cambió') });
    mocks.rpc.mockImplementation(async (name: string) => name === 'community_profile_capabilities'
      ? { data: { content: true }, error: null } : { data: null, error: { code: '23514' } });
    expect(await saveCommunityShowcase(payload)).toEqual({ ok: false, error: expect.stringContaining('video') });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it('treats a missing or RLS-hidden showcase as absent, and errors as failures', async () => {
    const q = reader(null);
    expect(await getCommunityShowcase(communityId)).toBeNull();
    expect(q.eq).toHaveBeenCalledWith('community_id', communityId);
    reader(null, { message: 'network' });
    await expect(getCommunityShowcase(communityId)).rejects.toThrow('presentación');
  });
  it('loads the bounded collection in one query, orders it, and strips archived media', async () => {
    const asset = { id: video1, media_id: 'public-stream', kind: 'video', deleted_at: null };
    const q = reader({ id: communityId, community_id: communityId, introduction: 'Intro', version: 2, is_published: true,
      videos: [
        { id: video2, asset_id: video2, position: 1, asset: { ...asset, media_id: 'archived-secret', deleted_at: '2026-10-08' } },
        { id: video1, asset_id: video1, position: 0, asset },
      ] });
    const result = await getCommunityShowcase(communityId);
    expect(result?.videos.map((video) => video.id)).toEqual([video1, video2]);
    expect(result?.videos[1].asset).toBeNull();
    expect(result?.videos[0].asset).not.toHaveProperty('deleted_at');
    expect(JSON.stringify(result)).not.toContain('archived-secret');
    expect(q.maybeSingle).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });
});
