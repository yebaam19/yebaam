import { beforeEach, describe, expect, it, vi } from 'vitest';
import { processAssetCleanup } from '@/features/communities/server/asset-cleanup.server';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), image: vi.fn(), video: vi.fn(), document: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ getServiceClient: () => ({ rpc: mocks.rpc, from: mocks.from }) }));
vi.mock('@/lib/cloudflare/images', () => ({ deleteImage: mocks.image, isCloudflareImageId: (id: string) => /^[a-f0-9-]{36}$/.test(id) }));
vi.mock('@/lib/cloudflare/stream', () => ({ deleteStreamVideo: mocks.video, isStreamUid: (id: string) => /^[a-f0-9]{32}$/.test(id) }));
vi.mock('@/lib/cloudflare/community-documents', () => ({ deleteLibraryDocument: mocks.document }));
const uuid = '11111111-1111-4111-8111-111111111111';
const job = { id: '1', kind: 'image', media_id: uuid, lease_token: uuid, attempts: 1 };
function references(data: { id: string }[] | null, error: unknown = null) {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data, error }) };
  mocks.from.mockReturnValue(query);
  return query;
}
beforeEach(() => {
  vi.resetAllMocks(); references([]);
  mocks.rpc.mockImplementation(async (name) => name === 'claim_community_asset_deletions'
    ? { data: [job], error: null } : { data: true, error: null });
});

describe('retired community media worker', () => {
  it('deletes only outbox targets and acknowledges the claimed lease', async () => {
    expect(await processAssetCleanup()).toEqual({ claimed: 1, completed: 1, retrying: 0 });
    expect(mocks.image).toHaveBeenCalledWith(uuid);
    expect(mocks.rpc).toHaveBeenCalledWith('finish_community_asset_deletion', {
      job_id: '1', claimed_lease: uuid, succeeded: true, failure_code: null,
    });
  });
  it.each(['active', 'unavailable'])('fails closed when reference checking is %s', async (state) => {
    references(state === 'active' ? [{ id: 'still-visible' }] : null, state === 'unavailable' ? {} : null);
    expect(await processAssetCleanup()).toMatchObject({ retrying: 1, completed: 0 });
    expect(mocks.image).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenLastCalledWith('finish_community_asset_deletion', expect.objectContaining({ succeeded: false }));
  });
  it('retains failures without saving provider errors or credentials', async () => {
    mocks.image.mockRejectedValue(new Error('token=DO_NOT_STORE'));
    expect(await processAssetCleanup()).toMatchObject({ retrying: 1 });
    expect(mocks.rpc).toHaveBeenLastCalledWith('finish_community_asset_deletion', expect.objectContaining({ failure_code: 'remote_delete_failed', succeeded: false }));
  });
  it('treats an unacknowledged deletion as retryable', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [job], error: null }).mockResolvedValueOnce({ data: false, error: null });
    expect(await processAssetCleanup()).toMatchObject({ retrying: 1, completed: 0 });
  });
  it('routes videos and scoped R2 documents to their providers', async () => {
    const key = `${uuid}/communities/${uuid}/${uuid}.pdf`;
    mocks.rpc.mockResolvedValueOnce({ data: [{ ...job, kind: 'video', media_id: 'a'.repeat(32) }, { ...job, id: '2', kind: 'document', media_id: key }], error: null });
    expect(await processAssetCleanup()).toMatchObject({ completed: 2 });
    expect(mocks.video).toHaveBeenCalledWith('a'.repeat(32));
    expect(mocks.document).toHaveBeenCalledWith(key);
  });
  it('rejects document keys outside the community namespace', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [{ ...job, kind: 'document', media_id: `${uuid}/cv.pdf` }], error: null });
    expect(await processAssetCleanup()).toMatchObject({ retrying: 1 });
    expect(mocks.document).not.toHaveBeenCalled();
  });
});
