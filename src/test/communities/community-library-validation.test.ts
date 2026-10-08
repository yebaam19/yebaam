import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateAssetUpload } from '@/features/communities/server/asset-validation.server';

const mocks = vi.hoisted(() => ({ image: vi.fn(), video: vi.fn(), head: vi.fn(), from: vi.fn() }));
vi.mock('@/lib/cloudflare/images', () => ({ getImageProvenance: mocks.image, isCloudflareImageId: (id: string) => /^[a-f0-9-]{36}$/.test(id) }));
vi.mock('@/lib/cloudflare/stream', () => ({ getStreamVideo: mocks.video, isStreamUid: (id: string) => /^[a-f0-9]{32}$/.test(id) }));
vi.mock('@/lib/cloudflare/r2', () => ({ headFile: mocks.head }));
vi.mock('@/utils/supabase/server', () => ({ getServiceClient: () => ({ from: mocks.from }) }));
const user = '11111111-1111-4111-8111-111111111111';
const id = '22222222-2222-4222-8222-222222222222';
const input = { communityId: user, id, mediaId: id, kind: 'image' as const, title: 'Image', fileName: 'a.png', contentType: 'image/png' };
beforeEach(() => vi.resetAllMocks());

describe('remote asset finalization validation', () => {
  it.each([
    { uploadedBy: 'another', source: `community-library:${user}`, ready: true },
    { uploadedBy: user, source: 'anon-chat', ready: true },
    { uploadedBy: user, source: `community-library:${user}`, ready: false },
    { uploadedBy: user, source: `community-library:${user}`, ready: true, requiresSignature: true },
  ])('rejects unowned, foreign-surface, unfinished, or signed-only images: %j', async (image) => {
    mocks.image.mockResolvedValue(image);
    await expect(validateAssetUpload(user, input)).rejects.toThrow();
  });
  it('rejects videos that are not ready or owned by the caller', async () => {
    const video = { ...input, kind: 'video' as const, mediaId: 'a'.repeat(32), fileName: 'a.mp4', contentType: 'video/mp4' };
    mocks.video.mockResolvedValueOnce({ readyToStream: false, meta: { uploadedBy: user } });
    await expect(validateAssetUpload(user, video)).rejects.toThrow();
    mocks.video.mockResolvedValueOnce({ readyToStream: true, meta: { uploadedBy: user, source: 'posts' } });
    await expect(validateAssetUpload(user, video)).rejects.toThrow();
    mocks.video.mockResolvedValueOnce({ readyToStream: true, duration: 12, meta: { uploadedBy: user, source: `community-library:${user}` } });
    expect(await validateAssetUpload(user, video)).toMatchObject({ duration: 12, mediaId: video.mediaId });
    mocks.video.mockResolvedValueOnce({ readyToStream: true, meta: { uploadedBy: 'another' } });
    await expect(validateAssetUpload(user, video)).rejects.toThrow();
  });
  it('derives a document key from its owned receipt and verifies the actual stored size and MIME', async () => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({
      data: { object_key: 'owner/verified.pdf', content_type: 'application/pdf', size_bytes: 1024, original_name: 'report.pdf' }, error: null,
    }) };
    mocks.from.mockReturnValue(query);
    const document = { ...input, kind: 'document' as const, contentType: 'application/pdf' };
    mocks.head.mockResolvedValueOnce({ exists: true, sizeBytes: 2048, contentType: 'application/pdf' });
    await expect(validateAssetUpload(user, document)).rejects.toThrow();
    mocks.head.mockResolvedValueOnce({ exists: true, sizeBytes: 1024, contentType: 'text/html' });
    await expect(validateAssetUpload(user, document)).rejects.toThrow();
    mocks.head.mockResolvedValueOnce({ exists: true, sizeBytes: 1024, contentType: 'application/pdf' });
    expect(await validateAssetUpload(user, document)).toMatchObject({ mediaId: 'owner/verified.pdf', fileName: 'report.pdf', sizeBytes: 1024 });
    expect(query.eq).toHaveBeenCalledWith('uploaded_by', user);
    expect(query.eq).toHaveBeenCalledWith('community_id', user);
  });
  it('never HEADs a caller-supplied object path', async () => {
    await expect(validateAssetUpload(user, { ...input, kind: 'document', mediaId: 'another/users/file.pdf' })).rejects.toThrow();
    expect(mocks.head).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
