/**
 * Hook personalizado para escuchar eventos de Usuarios en tiempo real
 * 
 * Uso:
 * ```tsx
 * function MyComponent() {
 *   const { onlineUsers, userStatus, changeStatus } = useUserEvents();
 *   
 *   // Cambiar tu propio estado
 *   changeStatus('away');
 * }
 * ```
 */

import { useEffect, useState } from 'react';
import { useSocket } from '@/providers/socket-provider';

type UserStatus = 'online' | 'away' | 'busy' | 'offline';

interface UserStatusData {
  userId: string;
  status: UserStatus;
  lastSeenAt?: string;
}

interface ProfileUpdateData {
  userId: string;
  firstName: string;
  lastName: string;
  bio?: string;
}

export function useUserEvents() {
  const { usersSocket, isUsersConnected } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [userStatus, setUserStatus] = useState<Record<string, UserStatus>>({});
  const [lastProfileUpdate, setLastProfileUpdate] = useState<ProfileUpdateData | null>(null);

  useEffect(() => {
    if (!usersSocket || !isUsersConnected) {
      console.log('[useUserEvents] Socket not connected yet');
      return;
    }

    console.log('[useUserEvents] Setting up event listeners');

    // Escuchar cambios de estado
    const handleStatusChanged = (data: UserStatusData) => {
      console.log('[useUserEvents] user_status_changed:', data);
      setUserStatus((prev) => ({ ...prev, [data.userId]: data.status }));
    };

    // Escuchar amigos online
    const handleFriendOnline = (data: { userId: string }) => {
      console.log('[useUserEvents] friend_online:', data);
      setOnlineUsers((prev) => new Set([...prev, data.userId]));
    };

    // Escuchar amigos offline
    const handleFriendOffline = (data: { userId: string }) => {
      console.log('[useUserEvents] friend_offline:', data);
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    // Escuchar actualización de perfil
    const handleProfileUpdate = (data: ProfileUpdateData) => {
      console.log('[useUserEvents] user_profile_updated:', data);
      setLastProfileUpdate(data);
    };

    // Escuchar actualización de avatar
    const handleAvatarUpdate = (data: { userId: string; avatarUrl: string }) => {
      console.log('[useUserEvents] user_avatar_updated:', data);
    };

    // Escuchar actualización de banner
    const handleBannerUpdate = (data: { userId: string; bannerUrl: string }) => {
      console.log('[useUserEvents] user_banner_updated:', data);
    };

    usersSocket.on('user_status_changed', handleStatusChanged);
    usersSocket.on('friend_online', handleFriendOnline);
    usersSocket.on('friend_offline', handleFriendOffline);
    usersSocket.on('user_profile_updated', handleProfileUpdate);
    usersSocket.on('user_avatar_updated', handleAvatarUpdate);
    usersSocket.on('user_banner_updated', handleBannerUpdate);

    // Cleanup
    return () => {
      console.log(' [useUserEvents] Cleaning up event listeners');
      usersSocket.off('user_status_changed', handleStatusChanged);
      usersSocket.off('friend_online', handleFriendOnline);
      usersSocket.off('friend_offline', handleFriendOffline);
      usersSocket.off('user_profile_updated', handleProfileUpdate);
      usersSocket.off('user_avatar_updated', handleAvatarUpdate);
      usersSocket.off('user_banner_updated', handleBannerUpdate);
    };
  }, [usersSocket, isUsersConnected]);

  // Función para cambiar tu propio estado
  const changeStatus = (status: UserStatus) => {
    if (!usersSocket || !isUsersConnected) {
      console.warn('[useUserEvents] Cannot change status - not connected');
      return;
    }

    console.log(`[useUserEvents] Emitting update_status: ${status}`);
    usersSocket.emit('update_status', { status });
  };

  // Función para unirse a una sala de usuario
  const joinUserRoom = (userId: string) => {
    if (!usersSocket || !isUsersConnected) {
      console.warn('[useUserEvents] Cannot join room - not connected');
      return;
    }

    console.log(`[useUserEvents] Joining user room: ${userId}`);
    usersSocket.emit('join_user_room', { userId });
  };

  return {
    onlineUsers: Array.from(onlineUsers),
    userStatus,
    lastProfileUpdate,
    isConnected: isUsersConnected,
    changeStatus,
    joinUserRoom,
  };
}
