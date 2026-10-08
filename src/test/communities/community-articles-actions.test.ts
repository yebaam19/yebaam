import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCommunityArticle, updateCommunityArticle } from '@/features/communities/actions/communityArticles/crud.actions';

const mocks = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/features/communities/actions/_shared', () => ({ requireSession: mocks.session }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));

const id = '11111111-1111-4111-8111-111111111111';
const communityId = '22222222-2222-4222-8222-222222222222';
const input = { id, communityId, title: ' Crónica ', content: '<p>Una idea privada.</p>', isPublished: false };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ userId: id, client: { rpc: mocks.rpc } });
  mocks.rpc.mockResolvedValue({ data: { id, slug: 'cronica-' + id, version: 1 }, error: null });
});

describe('community article write actions', () => {
  it('keeps a new article private and forwards only validated fields to the locked RPC', async () => {
    expect((await createCommunityArticle({ ...input, authorId: communityId } as typeof input)).ok).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith('save_community_article', {
      target_community: communityId, target_id: id, expected_version: 0,
      payload: expect.objectContaining({ title: 'Crónica', isPublished: false, coverAssetId: null, attachmentIds: [] }),
    });
    expect(mocks.rpc.mock.calls[0][1].payload).not.toHaveProperty('authorId');
  });

  it('rejects invalid media and weak published content before opening a session', async () => {
    expect((await createCommunityArticle({ ...input, coverAssetId: 'bad' })).ok).toBe(false);
    expect((await createCommunityArticle({ ...input, isPublished: true })).ok).toBe(false);
    expect((await createCommunityArticle({ ...input, attachmentIds: [id, id] })).ok).toBe(false);
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it('requires a verified session and passes the expected version for edits', async () => {
    mocks.session.mockResolvedValueOnce(null);
    expect((await createCommunityArticle(input)).ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
    mocks.rpc.mockResolvedValueOnce({ data: { id, slug: 'cronica-' + id, version: 4 }, error: null });
    expect((await updateCommunityArticle({ ...input, articleId: id, expectedVersion: 3 })).ok).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith('save_community_article', expect.objectContaining({ expected_version: 3 }));
  });
});
