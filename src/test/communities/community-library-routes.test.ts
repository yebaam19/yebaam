import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/communities/[communityId]/documents/upload-url/route';
import { GET } from '@/app/api/communities/[communityId]/assets/[assetId]/file/route';
import { signCommunityDocument } from '@/features/communities/server/document-upload.server';

const mocks = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn(), prepare: vi.fn(), getUser: vi.fn(), presign: vi.fn(), fileUrl: vi.fn(), asset: vi.fn(), rate: vi.fn() }));
vi.mock('@/features/communities/actions/_shared', () => ({ requireSession: mocks.session }));
vi.mock('@/utils/supabase/server', () => ({ getServiceClient: () => ({ rpc: mocks.prepare }), getServerClient: async () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock('@/lib/cloudflare/r2', () => ({ getPresignedUploadUrl: mocks.presign }));
vi.mock('@/lib/cloudflare/community-documents', () => ({ signLibraryDocument: mocks.fileUrl }));
vi.mock('@/features/communities/server/community-library.server', () => ({ getLibraryAsset: mocks.asset }));
vi.mock('@/lib/api/rate-limit', () => ({ checkRateLimit: mocks.rate }));

const userId = '11111111-1111-4111-8111-111111111111';
const communityId = '22222222-2222-4222-8222-222222222222';
const uploadId = '33333333-3333-4333-8333-333333333333';
const body = { uploadId, fileName: 'report.pdf', contentType: 'application/pdf', sizeBytes: 1024 };
const params = Promise.resolve({ communityId });
const fileParams = Promise.resolve({ communityId, assetId: uploadId });
const request = () => new NextRequest('https://app.test/api/upload', { method: 'POST', body: JSON.stringify(body) });
const key = `${userId}/communities/${communityId}/${uploadId}.pdf`;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ userId, client: { rpc: mocks.rpc } });
  mocks.rpc.mockResolvedValue({ data: { content: true }, error: null });
  mocks.prepare.mockResolvedValue({ data: true, error: null });
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
  mocks.rate.mockReturnValue({ ok: true });
});
describe('library route authorization and presigning', () => {
  it('requires a verified session and content capability before spending signing credentials', async () => {
    mocks.session.mockResolvedValueOnce(null);
    expect((await POST(request(), { params })).status).toBe(401);
    mocks.rpc.mockResolvedValueOnce({ data: { content: false }, error: null });
    expect((await POST(request(), { params })).status).toBe(403);
    expect(mocks.presign).not.toHaveBeenCalled();
    expect(mocks.prepare).not.toHaveBeenCalled();
  });
  it('reuses the owned ledger identity and signs exact MIME, size and short TTL', async () => {
    mocks.presign.mockResolvedValue({ url: 'https://r2.test/signed', key });
    const response = await POST(request(), { params });
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mocks.presign).toHaveBeenCalledWith(key, 'application/pdf', 300, 1024);
    expect(mocks.prepare).toHaveBeenCalledWith('prepare_community_document_upload', {
      target_community: communityId, actor: userId, upload_id: uploadId, object_key: key,
      mime_type: 'application/pdf', byte_size: 1024, original_name: 'report.pdf',
    });
  });
  it('does not sign a conflicting or already-finalized upload ID', async () => {
    mocks.prepare.mockResolvedValue({ data: false, error: null });
    await expect(signCommunityDocument({ userId, client: {} } as never, { ...body, communityId })).rejects.toThrow();
    mocks.prepare.mockResolvedValue({ data: null, error: { code: '23505' } });
    await expect(signCommunityDocument({ userId, client: {} } as never, { ...body, communityId })).rejects.toThrow();
    expect(mocks.presign).not.toHaveBeenCalled();
  });
  it('denies a document absent from the RLS-bound result before signing its delivery URL', async () => {
    mocks.asset.mockResolvedValue(null);
    const response = await GET(new NextRequest('https://app.test/file'), { params: fileParams });
    expect(response.status).toBe(404);
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(mocks.fileUrl).not.toHaveBeenCalled();
  });
  it('uses only the RLS-visible stored key and filename, even for public visitors', async () => {
    mocks.asset.mockResolvedValue({ kind: 'document', media_id: key, original_name: 'report.pdf', content_type: 'application/pdf' });
    mocks.fileUrl.mockResolvedValue('https://r2.test/short-lived');
    const response = await GET(new NextRequest('https://app.test/file?preview=1&key=someone-else'), { params: fileParams });
    expect(response.status).toBe(307);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mocks.fileUrl).toHaveBeenCalledWith(key, 'report.pdf', 'application/pdf', true);
  });
});
