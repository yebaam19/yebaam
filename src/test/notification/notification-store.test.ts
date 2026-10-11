import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useNotificationStore } from '@/features/notification/store/notification.store';
import { notificationService } from '@/features/notification/services/notification.service';
import { NotificationType, type Notification, type NotificationsResponse } from '@/features/notification/interfaces/notification.interfaces';

vi.mock('@/features/auth/store/auth.store', () => ({ useAuthStore: create(() => ({ user: null })) }));
vi.mock('@/features/notification/services/notification.service', () => ({ notificationService: {
  getAll: vi.fn(), getStats: vi.fn(), markAsRead: vi.fn(), markAllAsRead: vi.fn(), deleteMany: vi.fn(),
} }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
const load = vi.mocked(notificationService.getAll);
const store = () => useNotificationStore.getState();
const row = (id: string, isRead = false): Notification => ({
  id, userId: 'viewer', type: NotificationType.POST_LIKE,
  actor: { id: 'actor', username: 'ana', displayName: 'Ana' },
  metadata: {}, message: 'reaccionó', isRead, createdAt: '2026-10-11T10:00:00Z',
});
const response = (notifications: Notification[] = [], page = 1, unreadCount = 1): NotificationsResponse => ({
  notifications, pagination: { page, limit: 20, total: 80, hasMore: true, unreadCount },
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));
  store().reset();
  useAuthStore.setState({ user: { id: 'viewer' } as never });
  load.mockResolvedValue(response());
});
afterEach(() => { store().stopPolling(); vi.useRealTimers(); });

describe('notification loading', () => {
  it('coalesces mount/open requests and caches an empty result', async () => {
    const pending = deferred<NotificationsResponse>();
    load.mockReturnValueOnce(pending.promise);
    const a = store().fetchNotifications();
    const b = store().fetchNotifications({ page: 1, limit: 20, filter: 'all' });
    expect(load).toHaveBeenCalledTimes(1);
    pending.resolve(response());
    await Promise.all([a, b]);
    await store().fetchNotifications();
    expect(load).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(15001);
    await store().fetchNotifications();
    expect(load).toHaveBeenCalledTimes(2);
  });
  it('restores a recently visited tab without another request', async () => {
    load.mockResolvedValueOnce(response([row('one', true), row('two')])).mockResolvedValueOnce(response([row('two')]));
    await store().fetchNotifications();
    await store().fetchNotifications({ filter: 'unread' });
    await store().fetchNotifications();
    expect(load).toHaveBeenCalledTimes(2);
    expect(store().notifications.map(n => n.id)).toEqual(['one', 'two']);
  });
  it('invalidates cached tabs when a realtime refresh arrives', async () => {
    await store().fetchNotifications();
    await store().fetchNotifications({ filter: 'unread' });
    await store().fetchNotifications({ filter: 'unread' }, true);
    await store().fetchNotifications();
    expect(load).toHaveBeenCalledTimes(4);
  });
  it('preserves unread filter and page size when paginating, without duplicate rows', async () => {
    load.mockResolvedValueOnce(response([row('one')])).mockResolvedValueOnce(response([row('one'), row('two')], 2));
    await store().fetchNotifications({ filter: 'unread', limit: 10 });
    await store().loadMore();
    expect(load).toHaveBeenLastCalledWith({ page: 2, limit: 10, filter: 'unread', before: { createdAt: row('one').createdAt, id: 'one' } });
    expect(store().notifications.map(n => n.id)).toEqual(['one', 'two']);
  });
  it('ignores a slow response from a previously selected filter', async () => {
    const pending = deferred<NotificationsResponse>();
    load.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(response([row('unread')]));
    const old = store().fetchNotifications();
    await store().fetchNotifications({ filter: 'unread' });
    pending.resolve(response([row('old', true)]));
    await old;
    expect(store().notifications.map(n => n.id)).toEqual(['unread']);
  });
  it('clears private data and rejects responses across account switches', async () => {
    const pending = deferred<NotificationsResponse>();
    load.mockReturnValueOnce(pending.promise);
    const old = store().fetchNotifications();
    useAuthStore.setState({ user: { id: 'other' } as never });
    pending.resolve(response([row('private')]));
    await old;
    expect(store().notifications).toEqual([]);
    expect(store().unreadCount).toBe(0);
  });
  it('gets the unread count from the server instead of the loaded subset', async () => {
    useNotificationStore.setState({ notifications: [row('one')] });
    vi.mocked(notificationService.getStats).mockResolvedValue({ totalCount: 90, unreadCount: 42, countByType: {} as never });
    await store().fetchStats();
    expect(store().unreadCount).toBe(42);
  });
  it('keeps existing rows and an actionable error when refreshing fails', async () => {
    load.mockResolvedValueOnce(response([row('one')]));
    await store().fetchNotifications();
    load.mockRejectedValueOnce(new Error('offline'));
    await store().fetchNotifications(undefined, true);
    expect(store().notifications.map(n => n.id)).toEqual(['one']);
    expect(store().error).toBe('offline');
    expect(store().isLoading).toBe(false);
  });
});

describe('notification writes', () => {
  it('marks all immediately, protects new arrivals, and supplies a server cutoff', async () => {
    const pending = deferred<void>();
    vi.mocked(notificationService.markAllAsRead).mockReturnValueOnce(pending.promise);
    useNotificationStore.setState({ notifications: [row('one')], unreadCount: 42 });
    const writing = store().markAllAsRead();
    expect(store().unreadCount).toBe(0);
    expect(store().notifications[0].isRead).toBe(true);
    expect(notificationService.markAllAsRead).toHaveBeenCalledWith('2026-10-11T12:00:00.000Z');
    useNotificationStore.setState({ notifications: [...store().notifications, row('new')], unreadCount: 1 });
    load.mockReturnValueOnce(new Promise(() => {}));
    pending.resolve();
    await writing;
    expect(store().notifications.find(n => n.id === 'new')?.isRead).toBe(false);
    expect(store().unreadCount).toBe(1);
  });
  it('rolls back only affected rows after failure, preserving concurrent arrivals', async () => {
    const pending = deferred<void>();
    vi.mocked(notificationService.markAsRead).mockReturnValueOnce(pending.promise);
    useNotificationStore.setState({ notifications: [row('one')], unreadCount: 1 });
    const writing = store().markOneAsRead('one');
    useNotificationStore.setState({ notifications: [...store().notifications, row('new')], unreadCount: 1 });
    load.mockReturnValueOnce(new Promise(() => {}));
    pending.reject(new Error('offline'));
    await writing;
    expect(store().notifications.map(n => [n.id, n.isRead])).toEqual([['one', false], ['new', false]]);
    expect(store().unreadCount).toBe(2);
  });
  it('prevents an older fetch from undoing an optimistic read', async () => {
    const reading = deferred<NotificationsResponse>();
    const writing = deferred<void>();
    load.mockReturnValueOnce(reading.promise);
    vi.mocked(notificationService.markAsRead).mockReturnValueOnce(writing.promise);
    useNotificationStore.setState({ notifications: [row('one')], unreadCount: 1 });
    const fetch = store().fetchNotifications();
    const mark = store().markOneAsRead('one');
    reading.resolve(response([row('one')]));
    await fetch;
    expect(store().notifications[0].isRead).toBe(true);
    load.mockResolvedValueOnce(response([row('one', true)], 1, 0));
    writing.resolve();
    await mark;
    await Promise.resolve();
    expect(store().pendingWrites).toBe(0);
    expect(store().notifications[0].isRead).toBe(true);
  });
  it('does not roll back private rows into another account when a write fails', async () => {
    const pending = deferred<void>();
    vi.mocked(notificationService.markAsRead).mockReturnValueOnce(pending.promise);
    useNotificationStore.setState({ notifications: [row('one')], unreadCount: 1 });
    const writing = store().markOneAsRead('one');
    useAuthStore.setState({ user: { id: 'other' } as never });
    pending.reject(new Error('offline'));
    await writing;
    expect(store().notifications).toEqual([]);
    expect(store().pendingWrites).toBe(0);
  });
});
