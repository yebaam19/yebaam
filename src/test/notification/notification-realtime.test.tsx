// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import { useNotificationRealtime } from '@/features/notification/hooks/useNotificationRealtime';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime';

vi.mock('@/features/auth/store/auth.store', () => ({ useAuthStore: create(() => ({ user: { id: 'viewer' } })) }));
vi.mock('@/features/notification/store/notification.store', () => ({ useNotificationStore: {
  getState: () => ({ activeFilters: { filter: 'unread' }, fetchNotifications: refresh, startPolling, stopPolling }),
} }));
vi.mock('@/utils/supabase/realtime', () => ({ subscribeToTable: vi.fn(() => 'channel'), unsubscribe: vi.fn() }));
const { refresh, startPolling, stopPolling } = vi.hoisted(() => ({ refresh: vi.fn(), startPolling: vi.fn(), stopPolling: vi.fn() }));
beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
afterEach(() => vi.useRealTimers());
describe('notification realtime', () => {
  it('scopes subscriptions to the recipient and coalesces row bursts', () => {
    const { unmount } = renderHook(() => useNotificationRealtime());
    const options = vi.mocked(subscribeToTable).mock.calls[0][0];
    expect(options.filter).toBe('recipient_id=eq.viewer');
    expect(options.events).toEqual(['INSERT', 'UPDATE']);
    act(() => {
      options.onChange({} as never);
      options.onChange({} as never);
      vi.advanceTimersByTime(250);
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith({ filter: 'unread', page: 1, before: undefined }, true);
    unmount();
    expect(unsubscribe).toHaveBeenCalledWith('channel');
    expect(stopPolling).toHaveBeenCalled();
  });
  it('cancels queued refreshes and old subscriptions on sign-out', () => {
    const { unmount } = renderHook(() => useNotificationRealtime());
    act(() => {
      vi.mocked(subscribeToTable).mock.calls[0][0].onChange({} as never);
      useAuthStore.setState({ user: null });
    });
    act(() => vi.advanceTimersByTime(500));
    expect(refresh).not.toHaveBeenCalled();
    expect(unsubscribe).toHaveBeenCalled();
    unmount();
  });
});
