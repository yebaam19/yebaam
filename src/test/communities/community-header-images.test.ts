import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveCommunityHeaderImage } from '@/features/communities/actions/header-images.actions';
import { getCommunityHeaderImages } from '@/features/communities/server/community-header-images.server';
import { DEFAULT_IMAGE_FRAMING as framing } from '@/features/communities/schemas/communityHeaderImage.schema';
const mocks = vi.hoisted(() => ({ session: vi.fn(), from: vi.fn(), provenance: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/features/communities/actions/_shared', () => ({ requireSession: mocks.session }));
vi.mock('@/lib/cloudflare/images', () => ({ getImageProvenance: mocks.provenance }));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: async () => ({ from: mocks.from }) }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('react', () => ({ cache: (fn: unknown) => fn }));
const communityId = '11111111-1111-4111-8111-111111111111';
const imageId = '22222222-2222-4222-8222-222222222222';
const payload = { communityId, target: 'cover', imageId, framing, expectedVersion: 1 };
const row = { cover_image: imageId, profile_image: null, cover_framing: framing, profile_framing: framing, header_image_version: 1 };
function query(data: unknown, error: unknown = null) {
  return { select: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data, error }) };
}
beforeEach(() => {
  vi.resetAllMocks(); mocks.session.mockResolvedValue({ userId: 'owner', client: { from: mocks.from } });
  mocks.provenance.mockResolvedValue({ uploadedBy: 'owner', ready: true, requiresSignature: false });
});
describe('Community identity images', () => {
  it('rejects invalid framing, foreign URL IDs and invalid version before session lookup', async () => {
    for (const patch of [{ framing: { ...framing, zoom: 0 } }, { framing: { ...framing, x: 101 } },
      { framing: { ...framing, y: NaN } }, { imageId: 'https://example.com/image.png' }, { expectedVersion: 0 }]) {
      expect((await saveCommunityHeaderImage({ ...payload, ...patch })).ok).toBe(false);
    }
    expect(mocks.session).not.toHaveBeenCalled();
  });
  it('requires a verified session and owner-filtered row', async () => {
    mocks.session.mockResolvedValueOnce(null);
    expect((await saveCommunityHeaderImage(payload)).ok).toBe(false);
    const q = query(null); mocks.from.mockReturnValue(q);
    expect((await saveCommunityHeaderImage(payload)).ok).toBe(false);
    expect(q.eq).toHaveBeenCalledWith('owner_id', 'owner'); expect(q.update).not.toHaveBeenCalled();
  });
  it('treats identical retries as success and refuses stale overwrites', async () => {
    const q = query({ ...row, header_image_version: 2 }); mocks.from.mockReturnValue(q);
    expect(await saveCommunityHeaderImage(payload)).toEqual({ ok: true, data: { version: 2 } });
    expect((await saveCommunityHeaderImage({ ...payload, framing: { ...framing, zoom: 2 } })).ok).toBe(false);
    expect(q.update).not.toHaveBeenCalled(); expect(mocks.provenance).not.toHaveBeenCalled();
  });
  it('saves existing-image framing with version and owner predicates without a remote upload check', async () => {
    const write = query({ header_image_version: 2 }); mocks.from.mockReturnValueOnce(query(row)).mockReturnValueOnce(write);
    expect((await saveCommunityHeaderImage({ ...payload, framing: { ...framing, zoom: 2 } })).ok).toBe(true);
    expect(write.update).toHaveBeenCalledWith({ cover_image: imageId, cover_framing: { ...framing, zoom: 2 } });
    expect(write.eq).toHaveBeenCalledWith('header_image_version', 1);
    expect(write.eq).toHaveBeenCalledWith('owner_id', 'owner'); expect(mocks.provenance).not.toHaveBeenCalled();
  });
  it('checks server-stamped upload ownership, readiness and private-image status before attachment', async () => {
    mocks.from.mockImplementation(() => query({ ...row, cover_image: null }));
    for (const provenance of [null, { uploadedBy: 'other', ready: true }, { uploadedBy: 'owner', ready: false }, { uploadedBy: 'owner', ready: true, requiresSignature: true }]) {
      mocks.provenance.mockResolvedValueOnce(provenance);
      expect((await saveCommunityHeaderImage(payload)).ok).toBe(false);
    }
    expect(mocks.from).toHaveBeenCalledTimes(4);
  });
  it('handles authorization changes during save and clears only the requested image on removal', async () => {
    const write = query(null); mocks.from.mockReturnValueOnce(query(row)).mockReturnValueOnce(write);
    expect((await saveCommunityHeaderImage({ ...payload, imageId: null })).ok).toBe(false);
    expect(write.update).toHaveBeenCalledWith({ cover_image: null, cover_framing: framing });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it('reads identity images through RLS, distinguishes missing from failures, and maps both frames', async () => {
    mocks.from.mockReturnValueOnce(query(row));
    expect(await getCommunityHeaderImages(communityId)).toEqual({ version: 1, cover: { id: imageId, framing }, profile: { id: null, framing } });
    mocks.from.mockReturnValueOnce(query(null)); expect(await getCommunityHeaderImages(communityId)).toBeNull();
    mocks.from.mockReturnValueOnce(query(null, { message: 'network' })); await expect(getCommunityHeaderImages(communityId)).rejects.toThrow('imágenes');
  });
});
