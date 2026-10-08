import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCommunityLeader, getCommunityLeaders, getLeaderCategories, getLeaderContacts, getLeaderMedia } from '@/features/communities/server/community-leaders.server';
const mocks = vi.hoisted(() => ({ client: vi.fn(), from: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: mocks.client }));
const id = '11111111-1111-4111-8111-111111111111';
function query(data: unknown, error: unknown = null) {
  return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error }).then(resolve) };
}
beforeEach(() => { vi.resetAllMocks(); mocks.client.mockResolvedValue({ from: mocks.from }); });
describe('Directory reads', () => {
  it('paginates first and batches portraits only for the 30 returned cards', async () => {
    const rows = Array.from({ length: 31 }, (_, position) => ({ id: `leader-${position}`, position }));
    const leaders = query(rows); const media = query([{ leader_id: 'leader-0', asset: { id, deleted_at: null } }]);
    mocks.from.mockReturnValueOnce(leaders).mockReturnValueOnce(media);
    const result = await getCommunityLeaders(id, id, null, JSON.stringify({ id, position: 4 }));
    expect(leaders.limit).toHaveBeenCalledWith(31);
    expect(leaders.select.mock.calls[0][0]).not.toContain('biography');
    expect(leaders.is).toHaveBeenCalledWith('category_id', null);
    expect(leaders.or).toHaveBeenCalledWith(`position.gt.4,and(position.eq.4,id.gt.${id})`);
    expect(media.in).toHaveBeenCalledWith('leader_id', rows.slice(0, 30).map((item) => item.id));
    expect(result.items).toHaveLength(30); expect(result.nextCursor).toEqual({ id: 'leader-29', position: 29 });
    expect(result.items[0].portrait?.asset).toEqual({ id });
  });
  it('does not query media for an empty page and keeps backend errors visible', async () => {
    mocks.from.mockReturnValue(query([])); expect((await getCommunityLeaders(id, id)).items).toEqual([]);
    expect(mocks.from).toHaveBeenCalledTimes(1);
    mocks.from.mockReturnValue(query(null, { code: '503' })); await expect(getLeaderCategories(id, id)).rejects.toThrow('categorías');
  });
  it('sanitizes detail text and handles missing records', async () => {
    mocks.from.mockReturnValueOnce(query(null)); expect(await getCommunityLeader(id, id)).toBeNull();
    mocks.from.mockReturnValue(query({ biography: '<p>Bio</p><script>bad()</script>', trajectory: '<p onclick="bad()">Work</p>' }));
    expect(await getCommunityLeader(id, id)).toEqual({ biography: '<p>Bio</p>', trajectory: '<p>Work</p>' });
  });
  it('preserves an unavailable editor media link but never renders its archived asset', async () => {
    const q = query([{ id, asset: { id, media_id: 'hidden', deleted_at: '2026-10-08' } }]); mocks.from.mockReturnValue(q);
    expect(await getLeaderMedia(id, id)).toEqual([{ id, asset: null }]); expect(q.limit).toHaveBeenCalledWith(3);
  });
  it('uses RLS for linked profiles and rejects unsafe social URLs and extra fields', async () => {
    const contact = query({ profile_id: id, social_links: [{ label: 'Web', url: 'https://example.test', extra: 'private' }, { label: 'Unsafe', url: 'javascript:x()' }] });
    mocks.from.mockReturnValueOnce(contact).mockReturnValueOnce(query(null));
    const result = await getLeaderContacts(id, id);
    expect(result?.profile_username).toBeNull(); expect(result?.social_links).toEqual([{ label: 'Web', url: 'https://example.test' }]);
    mocks.from.mockReturnValueOnce(contact).mockReturnValueOnce(query(null, { code: '503' }));
    await expect(getLeaderContacts(id, id)).rejects.toThrow('perfil vinculado');
  });
});
