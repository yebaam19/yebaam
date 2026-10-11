'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime';
import { useNotificationStore } from '../store/notification.store';

/** One subscription owned by the app bell; the full page shares its store. */
export function useNotificationRealtime() {
  const userId = useAuthStore(state => state.user?.id);
  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      const store = useNotificationStore.getState();
      void store.fetchNotifications({ ...store.activeFilters, page: 1, before: undefined }, true);
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 250);
    };
    const onVisible = () => { if (document.visibilityState === 'visible') schedule(); };
    const channel = subscribeToTable({
      channel: `notifications:${userId}`, table: 'notifications',
      filter: `recipient_id=eq.${userId}`, events: ['INSERT', 'UPDATE'], onChange: schedule,
    });
    useNotificationStore.getState().startPolling();
    window.addEventListener('online', schedule);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      unsubscribe(channel);
      useNotificationStore.getState().stopPolling();
      window.removeEventListener('online', schedule);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId]);
}
