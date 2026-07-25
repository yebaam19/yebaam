/**
 * Notification realtime channel — currently inert.
 *
 * This hook used to open three `socket.io-client` connections
 * (`/notifications`, `/users`, `/friendships`) against the legacy backend. Every
 * one of them was already gated behind `isRealtimeEnabled()`, i.e.
 * `NEXT_PUBLIC_REALTIME_ENABLED`, which is set in no environment — so no socket
 * was ever opened and none of the toasts/refetches below it ever fired.
 *
 * What survives is the one side effect that was NOT gated: asking the browser
 * for Notification permission. Everything else is a typed no-op so callers keep
 * compiling. Reimplement on Supabase Realtime — see `subscribeToTable` in
 * `@/utils/supabase/realtime`.
 */

'use client';

import { useEffect, useCallback } from 'react';

export function useNotificationWebSocket() {
  const noop = useCallback(() => {}, []);

  // Pedir permiso para notificaciones del navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(() => {
        // Manejar el permiso otorgado o denegado
      });
    }
  }, []);

  return {
    socket: null,
    usersSocket: null,
    friendshipsSocket: null,
    isConnected: false,
    isUsersConnected: false,
    isFriendshipsConnected: false,
    connect: noop,
    connectToUsers: noop,
    connectToFriendships: noop,
    disconnect: noop,
    markAsRead: noop as (notificationId: string) => void,
    markAllAsRead: noop,
  };
}
