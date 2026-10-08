import { beforeEach, describe, expect, it, vi } from 'vitest';
import { attachLibraryAsset, detachLibraryAsset } from '@/features/communities/actions/library/attachments.actions';

const mocks = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn(), from: vi.fn() }));
vi.mock('@/features/communities/actions/_shared', () => ({ requireSession: mocks.session }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
const id = '11111111-1111-4111-8111-111111111111';
const existingId = '22222222-2222-4222-8222-222222222222';
const input = { id, communityId: id, pointId: id, assetId: id };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ userId: id, client: { from: mocks.from, rpc: mocks.rpc } });
  mocks.rpc.mockResolvedValue({ data: { plans: true }, error: null });
});
describe('attachment retry boundaries', () => {
  it('returns the persisted identity after a duplicate attachment is ignored', async () => {
    const query = { upsert: vi.fn().mockResolvedValue({ error: null }), select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: existingId }, error: null }) };
    mocks.from.mockReturnValue(query);
    expect(await attachLibraryAsset(input)).toEqual({ ok: true, data: { id: existingId } });
    expect(query.upsert).toHaveBeenCalledWith(expect.objectContaining({ point_id: id, asset_id: id }), { onConflict: 'point_id,asset_id', ignoreDuplicates: true });
    expect(query.eq).toHaveBeenCalledWith('community_id', id);
  });
  it('requires confirmation before removing an attachment', async () => {
    expect((await detachLibraryAsset(input)).ok).toBe(false);
    expect(mocks.session).not.toHaveBeenCalled();
  });
});
