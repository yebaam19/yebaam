import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveCommunityEvent, changeCommunityEvent } from '@/features/communities/actions/events/write.actions';
import { setEventAttendance } from '@/features/communities/actions/events/read-attendance.actions';
const mocks = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn(), from: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/features/communities/actions/_shared', () => ({ requireSession: mocks.session }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('@/features/communities/server/community-events.server', () => ({ getCommunityEvents: vi.fn() }));
const id = '11111111-1111-4111-8111-111111111111';
const communityId = '22222222-2222-4222-8222-222222222222';
const input = { id, communityId, expectedVersion: 0, title: 'Encuentro', organizer: 'Comunidad', location: 'Salón', startsAt: '2026-10-31T23:00:00-05:00', endsAt: '2026-11-01T00:00:00-05:00' };
function query(data: unknown, error: unknown = null) {
  return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data, error }), update: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data, error }) };
}
beforeEach(() => {
  vi.resetAllMocks(); mocks.session.mockResolvedValue({ userId: id, client: { rpc: mocks.rpc, from: mocks.from } });
  mocks.rpc.mockResolvedValue({ data: { settings: true, content: true }, error: null });
});
describe('Event authority and writes', () => {
  it('requires verified session and settings capability before touching events', async () => {
    mocks.session.mockResolvedValueOnce(null);
    expect((await saveCommunityEvent(input)).ok).toBe(false);
    mocks.rpc.mockResolvedValueOnce({ data: { settings: false, content: true }, error: null });
    expect((await saveCommunityEvent(input)).ok).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('creates a stable unpublished record and treats an exact retry as success', async () => {
    const read = query(null); const write = query(null); mocks.from.mockReturnValueOnce(read).mockReturnValue(write);
    expect((await saveCommunityEvent(input)).ok).toBe(true);
    const patch = write.insert.mock.calls[0][0];
    expect(patch).toMatchObject({ id, community_id: communityId, is_published: false, rsvp_enabled: false });
    const existing = query({ ...patch, version: 1, deleted_at: null, starts_at: '2026-11-01T04:00:00Z' });
    mocks.from.mockReturnValue(existing);
    expect((await saveCommunityEvent(input)).ok).toBe(true);
    expect(existing.insert).not.toHaveBeenCalled(); expect(existing.update).not.toHaveBeenCalled();
  });
  it('refuses stale or archived saves and detects a concurrent update', async () => {
    const stale = query({ version: 2, deleted_at: null }); mocks.from.mockReturnValue(stale);
    expect((await saveCommunityEvent({ ...input, expectedVersion: 1 })).ok).toBe(false);
    expect(stale.update).not.toHaveBeenCalled();
    const archived = query({ deleted_at: '2026-10-01' }); mocks.from.mockReturnValue(archived);
    expect((await saveCommunityEvent(input)).ok).toBe(false);
    const read = query({ version: 1, deleted_at: null }); const write = query(null);
    mocks.from.mockReturnValueOnce(read).mockReturnValue(write);
    expect((await saveCommunityEvent({ ...input, expectedVersion: 1 })).ok).toBe(false);
    expect(write.eq).toHaveBeenCalledWith('version', 1);
    expect(write.eq).toHaveBeenCalledWith('community_id', communityId);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it('requires confirmation and versions cancellation, allowing an exact retry', async () => {
    expect((await changeCommunityEvent({ communityId, id, expectedVersion: 1, operation: 'cancel' })).ok).toBe(false);
    expect(mocks.session).not.toHaveBeenCalled();
    const read = query({ id, version: 1, is_cancelled: false, deleted_at: null }); const write = query({ id });
    mocks.from.mockReturnValueOnce(read).mockReturnValue(write);
    expect((await changeCommunityEvent({ communityId, id, expectedVersion: 1, operation: 'cancel', confirmed: true })).ok).toBe(true);
    expect(write.update).toHaveBeenCalledWith({ is_cancelled: true });
    expect(write.eq).toHaveBeenCalledWith('version', 1);
    const retry = query({ id, version: 2, is_cancelled: true, deleted_at: null }); mocks.from.mockReturnValue(retry);
    expect((await changeCommunityEvent({ communityId, id, expectedVersion: 1, operation: 'cancel', confirmed: true })).ok).toBe(true);
    expect(retry.update).not.toHaveBeenCalled();
  });
  it('sends no user id to attendance RPC and fails closed without a session', async () => {
    mocks.session.mockResolvedValueOnce(null);
    expect((await setEventAttendance({ eventId: id, attending: true })).ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
    mocks.rpc.mockResolvedValueOnce({ data: true, error: null });
    expect(await setEventAttendance({ eventId: id, attending: true, userId: communityId })).toEqual({ ok: true, data: { attending: true } });
    expect(mocks.rpc).toHaveBeenCalledWith('set_community_event_attendance', { target_event: id, attending: true });
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '23514' } });
    expect(await setEventAttendance({ eventId: id, attending: true })).toMatchObject({ ok: false, error: expect.stringContaining('cerrada') });
  });
});
