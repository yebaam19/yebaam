import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveCommunityHeaderImage } from '@/features/communities/actions/header-images.actions';
import { getCommunityHeaderImages } from '@/features/communities/server/community-header-images.server';
import { DEFAULT_IMAGE_FRAMING as framing } from '@/features/communities/schemas/communityHeaderImage.schema';

const mocks = vi.hoisted(() => ({
  profileSession: vi.fn(), from: vi.fn(), rpc: vi.fn(),
  register: vi.fn(), revalidate: vi.fn(),
}));
vi.mock('@/features/communities/server/profile-session.server', () => ({
  requireProfileSession: mocks.profileSession,
}));
vi.mock('@/features/communities/server/community-header-image-receipt.server', () => ({
  registerCommunityHeaderImage: mocks.register,
}));
vi.mock('@/utils/supabase/server', () => ({
  getServerClient: async () => ({ from: mocks.from }),
  getServiceClient: () => ({ rpc: mocks.rpc }),
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('react', () => ({ cache: (fn: unknown) => fn }));

const communityId = '11111111-1111-4111-8111-111111111111';
const imageId = '22222222-2222-4222-8222-222222222222';
const payload = { communityId, target: 'cover', imageId, framing, expectedVersion: 1 };
const row = { cover_image: imageId, profile_image: null, cover_framing: framing, profile_framing: framing, header_image_version: 1 };
function query(data: unknown, error: unknown = null) {
  return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data, error }) };
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.profileSession.mockResolvedValue({ ok: true, session: { userId: 'admin', client: { from: mocks.from } } });
  mocks.register.mockResolvedValue(true);
  mocks.rpc.mockResolvedValue({ data: 2, error: null });
});

describe('Community identity images', () => {
  it('rejects invalid framing, URLs and invalid versions before authorization', async () => {
    for (const patch of [{ framing: { ...framing, zoom: 0 } }, { framing: { ...framing, x: 101 } },
      { framing: { ...framing, y: NaN } }, { imageId: 'https://example.com/image.png' }, { expectedVersion: 0 }]) {
      expect((await saveCommunityHeaderImage({ ...payload, ...patch })).ok).toBe(false);
    }
    expect(mocks.profileSession).not.toHaveBeenCalled();
  });
  it('requires delegated settings permission and a readable community', async () => {
    mocks.profileSession.mockResolvedValueOnce({ ok: false, status: 403, error: 'Sin permiso' });
    expect(await saveCommunityHeaderImage(payload)).toEqual({ ok: false, error: 'Sin permiso' });
    mocks.from.mockReturnValue(query(null));
    expect((await saveCommunityHeaderImage(payload)).ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.profileSession).toHaveBeenCalledWith(communityId, 'settings');
  });
  it('treats identical retries as success and refuses stale overwrites', async () => {
    mocks.from.mockReturnValue(query({ ...row, header_image_version: 2 }));
    expect(await saveCommunityHeaderImage(payload)).toEqual({ ok: true, data: { version: 2 } });
    expect((await saveCommunityHeaderImage({ ...payload, framing: { ...framing, zoom: 2 } })).ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('saves existing-image framing with a narrow privileged RPC and verified actor', async () => {
    mocks.from.mockReturnValue(query(row));
    const result = await saveCommunityHeaderImage({ ...payload, framing: { ...framing, zoom: 2 } });
    expect(result).toEqual({ ok: true, data: { version: 2 } });
    expect(mocks.rpc).toHaveBeenCalledWith('save_community_header_image', {
      p_community_id: communityId, p_actor_id: 'admin', p_target: 'cover',
      p_image_id: imageId, p_framing: { ...framing, zoom: 2 }, p_expected_version: 1,
    });
    expect(mocks.register).not.toHaveBeenCalled();
  });
  it('requires a verified upload receipt before a new attachment', async () => {
    mocks.from.mockReturnValue(query({ ...row, cover_image: null }));
    mocks.register.mockResolvedValueOnce(false);
    expect((await saveCommunityHeaderImage(payload)).ok).toBe(false);
    expect(mocks.register).toHaveBeenCalledWith(imageId, 'admin');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('surfaces role revocation and a version race from the locked database write', async () => {
    mocks.from.mockReturnValue(query(row));
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '42501' } });
    expect((await saveCommunityHeaderImage({ ...payload, imageId: null })).ok).toBe(false);
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '40001' } });
    expect((await saveCommunityHeaderImage({ ...payload, imageId: null })).ok).toBe(false);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it('reads identity images through RLS and distinguishes absence from failure', async () => {
    mocks.from.mockReturnValueOnce(query(row));
    expect(await getCommunityHeaderImages(communityId)).toEqual({
      version: 1, cover: { id: imageId, framing }, profile: { id: null, framing },
    });
    mocks.from.mockReturnValueOnce(query(null));
    expect(await getCommunityHeaderImages(communityId)).toBeNull();
    mocks.from.mockReturnValueOnce(query(null, { message: 'network' }));
    await expect(getCommunityHeaderImages(communityId)).rejects.toThrow('imágenes');
  });
});
