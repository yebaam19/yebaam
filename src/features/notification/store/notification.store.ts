'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { notificationWriteActions } from './notification-write-actions';
import { notificationError } from '../services/notification-error';
import type { NotificationState } from './notification-state';
import { notificationService } from '../services/notification.service';
import type { GetNotificationsFilters } from '../interfaces/notification.interfaces';

const initialState = {
  notifications: [], unreadCount: 0, stats: null, preferences: null,
  isLoading: false, error: null, currentPage: 1, hasMore: true,
  isPolling: false, pollingInterval: 60000,
  activeFilters: { page: 1, limit: 20, filter: 'all' } as GetNotificationsFilters,
  lastFetchedAt: 0, revision: 0, sessionVersion: 0, pendingWrites: 0,
};
let pollingIntervalId: ReturnType<typeof setInterval> | null = null;
let requestSequence = 0;
let refreshQueued = false;
let inFlight: { key: string; promise: Promise<void> } | null = null;
type CachedList = Pick<NotificationState, 'notifications' | 'currentPage' | 'hasMore' | 'lastFetchedAt'> & { revision: number };
const cachedLists = new Map<string, CachedList>();
const filterKey = (filters: GetNotificationsFilters) => JSON.stringify([
  filters.limit, filters.filter, filters.type, filters.isRead, filters.since,
]);

export const useNotificationStore = create<NotificationState>()(devtools((set, get) => ({
  ...initialState,
  fetchNotifications: async (filters, force = false) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    const requested = { page: 1, limit: 20, filter: 'all' as const, ...filters };
    const sameFilter = filterKey(requested) === filterKey(get().activeFilters);
    if (force) cachedLists.clear();
    if (get().pendingWrites > 0) {
      set({ activeFilters: requested, lastFetchedAt: 0 });
      return;
    }
    const key = `${userId}:${get().revision}:${filterKey(requested)}:${requested.page}`;
    if (inFlight?.key === key) {
      if (force) refreshQueued = true;
      return inFlight.promise;
    }
    const cached = cachedLists.get(filterKey(requested));
    if (!force && requested.page === 1 && cached && cached.revision === get().revision &&
        Date.now() - cached.lastFetchedAt < 15000) {
      requestSequence++;
      inFlight = null;
      refreshQueued = false;
      set({ ...cached, activeFilters: requested, isLoading: false, error: null });
      return;
    }
    const sequence = ++requestSequence;
    const revision = get().revision;
    const isCurrent = () => sequence === requestSequence && revision === get().revision &&
      useAuthStore.getState().user?.id === userId;
    set({ isLoading: true, error: null, activeFilters: requested,
      ...(!sameFilter ? { notifications: [], currentPage: 1, hasMore: true, lastFetchedAt: 0 } : {}),
    });
    const promise = (async () => {
      try {
        const response = await notificationService.getAll(requested);
        if (!isCurrent()) return;
        const rows = response.notifications.filter(n => n.userId === userId);
        const combined = requested.page === 1 ? rows : [...get().notifications, ...rows];
        set({
          notifications: Array.from(new Map(combined.map(n => [n.id, n])).values()),
          unreadCount: response.pagination.unreadCount,
          currentPage: response.pagination.page, hasMore: response.pagination.hasMore,
          lastFetchedAt: Date.now(),
        });
        const state = get();
        cachedLists.set(filterKey(requested), {
          notifications: state.notifications, currentPage: state.currentPage, hasMore: state.hasMore,
          lastFetchedAt: state.lastFetchedAt, revision,
        });
      } catch (error) {
        if (isCurrent()) set({ error: notificationError(error).message || 'Error al cargar notificaciones' });
      } finally {
        if (sequence === requestSequence) {
          inFlight = null;
          set({ isLoading: false });
          if (refreshQueued) {
            refreshQueued = false;
            void get().fetchNotifications({ ...get().activeFilters, page: 1, before: undefined }, true);
          }
        }
      }
    })();
    inFlight = { key, promise };
    return promise;
  },
  fetchStats: async () => {
    const userId = useAuthStore.getState().user?.id;
    const revision = get().revision;
    const sequence = requestSequence;
    if (!userId || get().pendingWrites) return;
    try {
      const stats = await notificationService.getStats();
      if (userId === useAuthStore.getState().user?.id && revision === get().revision && sequence === requestSequence) {
        const countChanged = stats.unreadCount !== get().unreadCount;
        set({ stats, unreadCount: stats.unreadCount });
        if (countChanged && get().lastFetchedAt) {
          void get().fetchNotifications({ ...get().activeFilters, page: 1, before: undefined }, true);
        }
      }
    } catch { /* Keep the last confirmed count during a temporary outage. */ }
  },
  fetchPreferences: async () => {
    const userId = useAuthStore.getState().user?.id;
    try {
      const preferences = await notificationService.getPreferences();
      if (userId === useAuthStore.getState().user?.id) set({ preferences });
    } catch { /* Preferences are not supported yet. */ }
  },
  loadMore: async () => {
    const { currentPage, hasMore, isLoading, activeFilters } = get();
    if (!hasMore || isLoading || get().pendingWrites) return;
    const last = get().notifications.at(-1);
    await get().fetchNotifications({ ...activeFilters, page: currentPage + 1,
      before: last ? { createdAt: last.createdAt, id: last.id } : undefined });
  },
  ...notificationWriteActions(set, get),
  startPolling: () => {
    if (get().isPolling) return;
    set({ isPolling: true });
    void get().fetchStats();
    pollingIntervalId = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') void get().fetchStats();
    }, get().pollingInterval);
  },
  stopPolling: () => {
    if (pollingIntervalId) clearInterval(pollingIntervalId);
    pollingIntervalId = null;
    set({ isPolling: false });
  },
  clearError: () => set({ error: null }),
  reset: () => {
    get().stopPolling();
    requestSequence++;
    cachedLists.clear();
    inFlight = null;
    refreshQueued = false;
    set({ ...initialState, revision: get().revision + 1, sessionVersion: get().sessionVersion + 1 });
  },
  updateNotificationInList: (id, updates) => set({
    notifications: get().notifications.map(n => n.id === id ? { ...n, ...updates } : n),
  }),
  removeNotificationFromList: id => set({ notifications: get().notifications.filter(n => n.id !== id) }),
}), { name: 'NotificationStore' }));

useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) useNotificationStore.getState().reset();
});
