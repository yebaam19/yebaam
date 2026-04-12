/**
 * usePresenceSync
 * 
 * Hook para sincronizar la presencia de usuarios con eventos de WebSocket.
 * Se debe usar en un componente de alto nivel (ej: Layout principal).
 */

'use client';

import { useEffect } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { usePresenceStore } from '../store/presence.store';
import { friendshipsService } from '@/features/friendships/services/friendships.service';

export function usePresenceSync() {
  const { usersSocket, isUsersConnected } = useSocket();
  const { 
    setUserOnline, 
    setUserOffline, 
    setUserStatus,
    initialize,
    isInitialized 
  } = usePresenceStore();

  // 1. Cargar usuarios online inicialmente desde el endpoint
  useEffect(() => {
    if (!isInitialized) {
      const loadOnlineUsers = async () => {
        try {

          const onlineUserIds = await friendshipsService.getOnlineFriends();
          initialize(onlineUserIds);
   
        } catch (error) {
          console.error('[PresenceSync]  Error loading online users:', error);
        }
      };

      loadOnlineUsers();
    }
  }, [isInitialized, initialize]);

  // 2. Escuchar eventos de WebSocket para actualizar presencia en tiempo real
  useEffect(() => {
    if (!usersSocket || !isUsersConnected) {

      return;
    }


    // Cuando un amigo se conecta
    const handleFriendOnline = (data: { userId: string }) => {

      setUserOnline(data.userId);
    };

    // Cuando un amigo se desconecta
    const handleFriendOffline = (data: { userId: string }) => {

      setUserOffline(data.userId);
    };

    // Cuando un usuario cambia su estado
    const handleUserStatusChanged = (data: { userId: string; status: 'online' | 'away' | 'busy' | 'offline' }) => {
      setUserStatus(data.userId, data.status);
    };

    // Registrar listeners
    usersSocket.on('friend_online', handleFriendOnline);
    usersSocket.on('friend_offline', handleFriendOffline);
    usersSocket.on('user_status_changed', handleUserStatusChanged);


    // Cleanup
    return () => {
    
      usersSocket.off('friend_online', handleFriendOnline);
      usersSocket.off('friend_offline', handleFriendOffline);
      usersSocket.off('user_status_changed', handleUserStatusChanged);
    };
  }, [usersSocket, isUsersConnected, setUserOnline, setUserOffline, setUserStatus]);

  return {
    isInitialized,
  };
}
