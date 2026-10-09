import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCommunity } from '@/features/communities/actions/create.actions';
import { updateCommunity } from '@/features/communities/actions/update.actions';
import { CommunityCategory, CommunityPrivacy } from '@/features/communities/types/community.types';

const mocks = vi.hoisted(() => ({
  user: vi.fn(), register: vi.fn(), insert: vi.fn(), forum: vi.fn(), revalidate: vi.fn(),
}));
vi.mock('@/features/communities/actions/_shared', () => ({
  requireUserId: mocks.user, revalidateCommunityPaths: mocks.revalidate,
}));
vi.mock('@/features/communities/server/community-header-image-receipt.server', () => ({
  registerCommunityHeaderImage: mocks.register,
}));
vi.mock('@/features/communities/server/community-forum.server', () => ({
  ensureCommunityForumSpace: mocks.forum,
}));
vi.mock('@/utils/supabase/server', () => ({
  getServerClient: async () => ({ from: () => ({
    select: () => ({ eq: async () => ({ count: 0 }) }),
    insert: mocks.insert,
  }) }),
  getServiceClient: () => ({ from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
  }) }),
}));

const userId = '11111111-1111-4111-8111-111111111111';
const imageId = '22222222-2222-4222-8222-222222222222';
const dto = { name: 'Comunidad de prueba', description: '', category: CommunityCategory.OTROS,
  privacy: CommunityPrivacy.PRIVATE, coverImageId: imageId };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue(userId);
  mocks.register.mockResolvedValue(true);
  mocks.insert.mockReturnValue({ select: () => ({ single: async () => ({
    data: { id: 'community-id', slug: 'comunidad-de-prueba' }, error: null,
  }) }) });
  mocks.forum.mockResolvedValue(undefined);
});

describe('community creation with an image', () => {
  it('does not create a community when Cloudflare ownership cannot be recorded', async () => {
    mocks.register.mockResolvedValueOnce(false);
    expect((await createCommunity(dto)).ok).toBe(false);
    expect(mocks.register).toHaveBeenCalledWith(imageId, userId);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('creates with the verified image ID and retains the caller as owner', async () => {
    expect(await createCommunity(dto)).toEqual({
      ok: true, data: { id: 'community-id', slug: 'comunidad-de-prueba' },
    });
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      owner_id: userId, cover_image: imageId, privacy: CommunityPrivacy.PRIVATE,
    }));
    expect(mocks.forum).toHaveBeenCalledWith(expect.objectContaining({ owner_id: userId }));
  });

  it('routes later image changes through the dedicated verified editor', async () => {
    const bypass = { id: 'community-id', coverImageId: imageId };
    expect((await updateCommunity(bypass)).ok).toBe(false);
    expect(mocks.register).not.toHaveBeenCalled();
  });
});
