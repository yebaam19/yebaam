import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCommunityEvent, getCommunityEvents, getEventAttendance } from '@/features/communities/server/community-events.server';
const mocks = vi.hoisted(() => ({ client: vi.fn(), from: vi.fn(), user: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: mocks.client }));
const id = '11111111-1111-4111-8111-111111111111';
function query(data: unknown, error: unknown = null) {
  const q = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), lt: vi.fn().mockReturnThis(), gt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error }).then(resolve) };
  mocks.from.mockReturnValue(q); return q;
}
beforeEach(() => { vi.resetAllMocks(); mocks.client.mockResolvedValue({ from: mocks.from, auth: { getUser: mocks.user } }); });
describe('Event reads', () => {
  it('bounds monthly overlap reads and uses a deterministic composite cursor', async () => {
    const startsAt = '2026-10-01T10:00:00Z';
    const q = query(Array.from({ length: 31 }, () => ({ id, starts_at: startsAt, cover: null })));
    const page = await getCommunityEvents(id, '2026-10', JSON.stringify({ id, startsAt }));
    expect(q.limit).toHaveBeenCalledWith(31);
    expect(q.eq).toHaveBeenCalledWith('community_id', id);
    expect(q.is).toHaveBeenCalledWith('deleted_at', null);
    expect(q.lt).toHaveBeenCalledWith('starts_at', '2026-11-01T00:00:00-05:00');
    expect(q.gt).toHaveBeenCalledWith('ends_at', '2026-10-01T00:00:00-05:00');
    expect(q.order.mock.calls).toEqual([['starts_at'], ['id']]);
    expect(q.or).toHaveBeenCalledWith(`starts_at.gt.${startsAt},and(starts_at.eq.${startsAt},id.gt.${id})`);
    expect(page.items).toHaveLength(30); expect(page.nextCursor).toEqual({ id, startsAt });
  });
  it('handles missing events, archived covers and database failures explicitly', async () => {
    query(null); expect(await getCommunityEvent(id, id)).toBeNull();
    query({ id, cover: { id, media_id: 'secret', deleted_at: '2026-10-01' } });
    expect(await getCommunityEvent(id, id)).toMatchObject({ cover: null });
    query({ id, cover: { id, title: 'Cover', media_id: 'cf-id', deleted_at: null } });
    expect(await getCommunityEvent(id, id)).toMatchObject({ cover: { id, title: 'Cover', media_id: 'cf-id' } });
    query(null, { code: '503' }); await expect(getCommunityEvent(id, id)).rejects.toThrow('No se pudo cargar');
  });
  it('queries only the verified callers attendance and skips guests', async () => {
    mocks.user.mockResolvedValueOnce({ data: { user: null } });
    expect(await getEventAttendance(id)).toEqual({ signedIn: false, attending: false });
    expect(mocks.from).not.toHaveBeenCalled();
    mocks.user.mockResolvedValue({ data: { user: { id: 'verified-user' } } }); const q = query({ event_id: id });
    expect(await getEventAttendance(id)).toEqual({ signedIn: true, attending: true });
    expect(q.eq).toHaveBeenCalledWith('user_id', 'verified-user');
  });
});
