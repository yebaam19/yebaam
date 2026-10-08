import { beforeEach, describe, expect, it, vi } from 'vitest';
import { libraryFileType, uploadLibraryItem, type LibraryUpload } from '@/features/communities/utils/library-upload';

const mocks = vi.hoisted(() => ({ image: vi.fn(), video: vi.fn(), document: vi.fn(), finalize: vi.fn() }));
vi.mock('@/lib/service/upload.service', () => ({ uploadService: { uploadImage: mocks.image, uploadVideo: mocks.video, uploadDocument: mocks.document } }));
vi.mock('@/features/communities/actions/library/content.actions', () => ({ finalizeLibraryAsset: mocks.finalize }));
const communityId = '11111111-1111-4111-8111-111111111111';
function row(file: File): LibraryUpload { return { id: '22222222-2222-4222-8222-222222222222', file, contentType: file.type, progress: 0, state: 'queued' }; }
beforeEach(() => { vi.resetAllMocks(); mocks.finalize.mockResolvedValue({ ok: true, data: { id: 'saved', version: 1 } }); });

describe('library upload queue retries', () => {
  it('reuses the uploaded image and stable record id when finalization fails', async () => {
    const item = row(new File(['image'], 'photo.png', { type: 'image/png' }));
    mocks.image.mockResolvedValue({ id: 'remote-image' });
    mocks.finalize.mockResolvedValueOnce({ ok: false, error: 'Retry later' });
    const patch = (value: Partial<LibraryUpload>) => Object.assign(item, value);
    await expect(uploadLibraryItem(communityId, 'image', item, patch)).rejects.toThrow('Retry later');
    expect(item.mediaId).toBe('remote-image');
    await uploadLibraryItem(communityId, 'image', item, patch);
    expect(mocks.image).toHaveBeenCalledOnce();
    expect(mocks.finalize.mock.calls[1][0]).toEqual(mocks.finalize.mock.calls[0][0]);
    expect(item.state).toBe('saved');
  });
  it('retains a Stream uid after processing timeout and retries only finalization', async () => {
    const item = row(new File(['video'], 'clip.mp4', { type: 'video/mp4' }));
    mocks.video.mockImplementationOnce(async (_file, options) => { options.onUploaded('remote-video'); throw new Error('Processing timed out'); });
    const patch = (value: Partial<LibraryUpload>) => Object.assign(item, value);
    await expect(uploadLibraryItem(communityId, 'video', item, patch)).rejects.toThrow();
    await uploadLibraryItem(communityId, 'video', item, patch);
    expect(mocks.video).toHaveBeenCalledOnce();
    expect(mocks.video.mock.calls[0][1].source).toBe(`community-library:${communityId}`);
    expect(mocks.finalize).toHaveBeenCalledWith(expect.objectContaining({ mediaId: 'remote-video' }));
  });
  it('finalizes documents using their ledger id, never the returned object path', async () => {
    const item = row(new File(['pdf'], 'report.pdf', { type: 'application/pdf' }));
    mocks.document.mockResolvedValue({ key: 'owner/private/report.pdf' });
    await uploadLibraryItem(communityId, 'document', item, (value) => Object.assign(item, value));
    expect(mocks.document).toHaveBeenCalledWith(item.file, expect.any(Function), { communityId, uploadId: item.id });
    expect(mocks.finalize).toHaveBeenCalledWith(expect.objectContaining({ id: item.id, mediaId: item.id }));
  });
  it('accepts known documents with empty browser MIME and rejects mismatches, empty and oversized files', () => {
    expect(libraryFileType(new File(['doc'], 'notes.pdf'), 'document')).toBe('application/pdf');
    expect(libraryFileType(new File(['x'], 'notes.pdf', { type: 'text/html' }), 'document')).toBeNull();
    expect(libraryFileType(new File([], 'image.png', { type: 'image/png' }), 'image')).toBeNull();
    expect(libraryFileType({ name: 'huge.png', type: 'image/png', size: 11 * 1024 * 1024 } as File, 'image')).toBeNull();
  });
});
