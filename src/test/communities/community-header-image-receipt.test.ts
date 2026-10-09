import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerCommunityHeaderImage } from '@/features/communities/server/community-header-image-receipt.server';

const mocks = vi.hoisted(() => ({ provenance: vi.fn(), insert: vi.fn(), read: vi.fn() }));
vi.mock('@/lib/cloudflare/images', () => ({
  isCloudflareImageId: (id: string) => /^[A-Za-z0-9_-]{20,64}$/.test(id),
  getImageProvenance: mocks.provenance,
}));
vi.mock('@/utils/supabase/server', () => ({
  getServiceClient: () => ({ from: () => ({
    insert: mocks.insert,
    select: () => ({ eq: () => ({ maybeSingle: mocks.read }) }),
  }) }),
}));

const imageId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.provenance.mockResolvedValue({ uploadedBy: userId, ready: true, requiresSignature: false });
  mocks.insert.mockResolvedValue({ error: null });
  mocks.read.mockResolvedValue({ data: { uploaded_by: userId }, error: null });
});

describe('community header upload receipt', () => {
  it('rejects invalid IDs and unowned, unfinished or private images', async () => {
    expect(await registerCommunityHeaderImage('not-an-image-id', userId)).toBe(false);
    for (const provenance of [null, { uploadedBy: 'another-user', ready: true },
      { uploadedBy: userId, ready: false },
      { uploadedBy: userId, ready: true, requiresSignature: true }]) {
      mocks.provenance.mockResolvedValueOnce(provenance);
      expect(await registerCommunityHeaderImage(imageId, userId)).toBe(false);
    }
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('records only the verified caller and accepts an identical retry', async () => {
    expect(await registerCommunityHeaderImage(imageId, userId)).toBe(true);
    expect(mocks.insert).toHaveBeenCalledWith({ image_id: imageId, uploaded_by: userId });
    mocks.insert.mockResolvedValueOnce({ error: { code: '23505' } });
    expect(await registerCommunityHeaderImage(imageId, userId)).toBe(true);
    mocks.insert.mockResolvedValueOnce({ error: { code: '23505' } });
    mocks.read.mockResolvedValueOnce({ data: { uploaded_by: 'another-user' }, error: null });
    expect(await registerCommunityHeaderImage(imageId, userId)).toBe(false);
  });

  it('fails closed when Cloudflare or the database cannot be checked', async () => {
    mocks.provenance.mockRejectedValueOnce(new Error('Cloudflare unavailable'));
    expect(await registerCommunityHeaderImage(imageId, userId)).toBe(false);
    mocks.insert.mockResolvedValueOnce({ error: { code: '503' } });
    expect(await registerCommunityHeaderImage(imageId, userId)).toBe(false);
  });
});
