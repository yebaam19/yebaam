import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createR2Uploads } from '@/lib/service/uploads/r2';
import { createMediaUploads } from '@/lib/service/uploads/media';
import { documentUploadSchema } from '@/features/communities/schemas/communityLibrary.schema';
import { documentContentType } from '@/lib/upload-documents';

const communityId = '11111111-1111-4111-8111-111111111111';
const uploadId = '22222222-2222-4222-8222-222222222222';
const fetchMock = vi.fn();
beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

describe('institutional upload contract', () => {
  it('retries a failed document PUT with the same upload identity and declared size', async () => {
    const transport = vi.fn().mockRejectedValueOnce(new Error('Network')).mockResolvedValueOnce(undefined);
    fetchMock.mockResolvedValue(reply({ data: { url: 'https://r2.test/put', key: 'owner/key.pdf' } }));
    // Each fetch response body can only be read once.
    fetchMock.mockImplementation(async () => reply({ data: { url: 'https://r2.test/put', key: 'owner/key.pdf' } }));
    const file = new File(['test'], 'plan.pdf', { type: 'application/pdf' });
    const result = await createR2Uploads(transport).uploadDocument(file, undefined, { communityId, uploadId });
    expect(result).toEqual({ key: 'owner/key.pdf', sizeBytes: 4, contentType: 'application/pdf' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [url, request] of fetchMock.mock.calls) {
      expect(url).toBe(`/api/communities/${communityId}/documents/upload-url`);
      expect(JSON.parse(request.body)).toEqual({ uploadId, fileName: 'plan.pdf', contentType: 'application/pdf', sizeBytes: 4 });
    }
    expect(transport).toHaveBeenLastCalledWith('https://r2.test/put', file, 'application/pdf', undefined);
  });
  it('does not retry signing failures or start a PUT without authorization', async () => {
    const transport = vi.fn();
    fetchMock.mockResolvedValue(reply({ error: 'Sin permiso' }, 403));
    await expect(createR2Uploads(transport).uploadDocument(new File(['x'], 'a.pdf', { type: 'application/pdf' }), undefined, { communityId, uploadId })).rejects.toThrow('Sin permiso');
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(transport).not.toHaveBeenCalled();
  });
  it('keeps the existing professional-service PDF endpoint contract', async () => {
    const transport = vi.fn().mockResolvedValue(undefined);
    fetchMock.mockResolvedValue(reply({ data: { url: 'https://r2.test/cv', key: 'cvs/file.pdf' } }));
    await createR2Uploads(transport).uploadDocument(new File(['cv'], 'cv.pdf', { type: 'application/pdf' }));
    expect(fetchMock.mock.calls[0][0]).toBe('/api/upload/file-url');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ contentType: 'application/pdf', sizeBytes: 2 });
  });
  it('normalizes supported files with an empty browser MIME but rejects mismatches and executables', () => {
    expect(documentContentType('Programa.DOCX', '')).toContain('wordprocessingml');
    expect(documentContentType('a.zip', 'application/x-zip-compressed')).toBe('application/zip');
    expect(documentContentType('a.pdf', 'text/html')).toBeNull();
    expect(documentContentType('a.html', 'text/html')).toBeNull();
    expect(documentContentType('a.exe', '')).toBeNull();
  });
  it('rejects zero, oversized, fractional sizes and spoofed MIME before signing', () => {
    const body = { communityId, uploadId, fileName: 'a.pdf', contentType: 'application/pdf', sizeBytes: 100 };
    expect(documentUploadSchema.safeParse(body).success).toBe(true);
    for (const sizeBytes of [0, 1.5, 10485761]) expect(documentUploadSchema.safeParse({ ...body, sizeBytes }).success).toBe(false);
    expect(documentUploadSchema.safeParse({ ...body, fileName: 'a.exe' }).success).toBe(false);
  });
  it('preserves Cloudflare image metadata and source through the extracted uploader', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH', 'hash');
    const transport = vi.fn().mockResolvedValue(undefined);
    fetchMock.mockResolvedValue(reply({ data: { id: uploadId, uploadURL: 'https://images.test/upload' } }));
    const file = new File(['image'], 'photo.png', { type: 'image/png' });
    const result = await createMediaUploads(transport).uploadImage(file, undefined, { source: `community-library:${communityId}` });
    expect(result).toEqual({ id: uploadId, url: `https://imagedelivery.net/hash/${uploadId}/public` });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).source).toBe(`community-library:${communityId}`);
    expect(transport).toHaveBeenCalledWith('https://images.test/upload', file, undefined);
  });
});
