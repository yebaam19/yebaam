import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveCommunityRelatedLink } from '@/features/communities/actions/relatedLinks.actions';

const mocks = vi.hoisted(() => ({ profileSession: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/features/communities/server/profile-session.server', () => ({ requireProfileSession: mocks.profileSession }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));

const communityId = '22222222-2222-4222-8222-222222222222';
const id = '33333333-3333-4333-8333-333333333333';
const imageAssetId = '44444444-4444-4444-8444-444444444444';
const input = { communityId, id, expectedVersion: 0, title: ' Aliados ', description: ' Proyecto ',
  href: 'https://example.org', imageAssetId, position: 1, isPublished: true };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.profileSession.mockResolvedValue({ ok: false, error: 'No tienes permiso.' });
});

describe('community related links', () => {
  it('rejects unsafe destinations and publication without an image before opening a session', async () => {
    expect((await saveCommunityRelatedLink({ ...input, href: 'javascript:alert(1)' })).ok).toBe(false);
    expect((await saveCommunityRelatedLink({ ...input, imageAssetId: null })).ok).toBe(false);
    expect(mocks.profileSession).not.toHaveBeenCalled();
  });

  it('checks the institutional settings capability before writing', async () => {
    expect((await saveCommunityRelatedLink(input)).ok).toBe(false);
    expect(mocks.profileSession).toHaveBeenCalledWith(communityId, 'settings');
  });

  it('inserts only validated fields and handles a repeated save without another write', async () => {
    const read = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    read.select.mockReturnValue(read); read.eq.mockReturnValue(read);
    read.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const write = { select: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: { id }, error: null }) };
    write.select.mockReturnValue(write);
    const insert = vi.fn().mockReturnValue(write);
    const from = vi.fn().mockReturnValue({ select: read.select, insert });
    mocks.profileSession.mockResolvedValue({ ok: true, session: { client: { from } } });

    expect((await saveCommunityRelatedLink({ ...input, ownerId: communityId } as typeof input)).ok).toBe(true);
    expect(insert).toHaveBeenCalledWith({ community_id: communityId, id, title: 'Aliados',
      description: 'Proyecto', href: 'https://example.org', image_asset_id: imageAssetId,
      position: 1, is_published: true });
    expect(insert.mock.calls[0][0]).not.toHaveProperty('ownerId');
    expect(mocks.revalidate).toHaveBeenCalledWith('/feed/comunidades/[slug]', 'layout');

    read.maybeSingle.mockResolvedValueOnce({ data: { id, version: 1, deleted_at: null,
      title: 'Aliados', description: 'Proyecto', href: 'https://example.org', image_asset_id: imageAssetId,
      position: 1, is_published: true }, error: null });
    expect((await saveCommunityRelatedLink({ ...input, expectedVersion: 1 })).ok).toBe(true);
    expect(insert).toHaveBeenCalledTimes(1);
  });
});
