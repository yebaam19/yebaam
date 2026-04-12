/**
 * Hook para sincronizar notificaciones en tiempo real
 * 
 * Conecta el socket de usuarios con el notification store
 * para actualizar automáticamente cuando llegan eventos.
 */

'use client';

import { useEffect } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { useNotificationStore } from '../store/notification.store';
import { useAuthStore } from '@/features/auth/store/auth.store';

export function useNotificationSync() {
  const { usersSocket } = useSocket();
  const { user } = useAuthStore();
  const fetchNotifications = useNotificationStore(state => state.fetchNotifications);

  useEffect(() => {
    if (!usersSocket || !user) {

      return;
    }



    // Cuando llega una nueva friend request
    const handleFriendRequestReceived = (data: any) => {

      // Refrescar notificaciones
      fetchNotifications({ page: 1, limit: 20 });
    };

    // Cuando aceptan tu friend request
    const handleFriendRequestAccepted = (data: any) => {

      // Refrescar notificaciones
      fetchNotifications({ page: 1, limit: 20 });
    };

    // Cuando rechazan tu friend request
    const handleFriendRequestRejected = (data: any) => {

      // Refrescar notificaciones
      fetchNotifications({ page: 1, limit: 20 });
    };

    // Cuando te eliminan como amigo
    const handleFriendRemoved = (data: any) => {

      fetchNotifications({ page: 1, limit: 20 });
    };

    // Cuando se actualizan las notificaciones (ej: marcar como leídas)
    const handleNotificationsUpdated = (data: any) => {
      fetchNotifications({ page: 1, limit: 20 });
    };

    // Registrar listeners
    usersSocket.on('friend_request_received', handleFriendRequestReceived);
    usersSocket.on('friend_request_accepted', handleFriendRequestAccepted);
    usersSocket.on('friend_request_rejected', handleFriendRequestRejected);
    usersSocket.on('friend_removed', handleFriendRemoved);
    usersSocket.on('notifications_updated', handleNotificationsUpdated);


    // Cleanup
    return () => {

      usersSocket.off('friend_request_received', handleFriendRequestReceived);
      usersSocket.off('friend_request_accepted', handleFriendRequestAccepted);
      usersSocket.off('friend_request_rejected', handleFriendRequestRejected);
      usersSocket.off('friend_removed', handleFriendRemoved);
      usersSocket.off('notifications_updated', handleNotificationsUpdated);
    };
  }, [usersSocket, user, fetchNotifications]);
}
