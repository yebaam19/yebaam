/**
 * Notification WebSocket Hook
 * 
 * Hook para manejar la conexión WebSocket de notificaciones en tiempo real.
 * Se conecta automáticamente cuando el usuario está autenticado.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '../store/notification.store';
import { NotificationType } from '../interfaces/notification.interfaces';
import { useFriendshipsStore } from '@/features/friendships/store/friendships.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { toast } from 'sonner';
import { isRealtimeEnabled } from '@/socket/realtime-flag';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const WEBSOCKET_URL = `${BACKEND_URL}/notifications`;
const USERS_WS_URL = `${BACKEND_URL}/users`;
const FRIENDSHIPS_WS_URL = `${BACKEND_URL}/friendships`;

export function useNotificationWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const usersSocketRef = useRef<Socket | null>(null);
  const friendshipsSocketRef = useRef<Socket | null>(null);
  const { user } = useAuthStore();
  const { fetchNotifications } = useNotificationStore();
  const { fetchPendingRequests } = useFriendshipsStore();
  const isConnectingRef = useRef(false);

  const connect = useCallback(() => {
    if (!isRealtimeEnabled()) return;
    if (!user?.id) {
      console.log('[WS-Notifications] No hay usuario autenticado, no conectar');
      return;
    }

    // Evitar reconexiones duplicadas
    if (socketRef.current?.connected || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;

    const socket = io(WEBSOCKET_URL, {
      query: {
        userId: user.id,
      },
      withCredentials: true, 
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
    
      isConnectingRef.current = false;
      
      // CRÍTICO: Unirse a la room personal del usuario
      socket.emit('join_notification_room', { userId: user.id }, (response: any) => {
        if (response?.success) {
     
        } else {
          console.error('Error al unirse a la room:', response);
        }
      });
      
      // Cargar notificaciones iniciales
      fetchNotifications({ page: 1, limit: 20 });
    });

    socket.on('disconnect', (reason) => {
      isConnectingRef.current = false;
    });

    socket.on('connect_error', (error) => {
      console.error('Error de conexión:', error);
      isConnectingRef.current = false;
    });

    const handleNewNotification = (notification: any) => {
      console.log('🔔🔔🔔 [WS-Notifications] ¡EVENTO RECIBIDO! new_notification', {
        notification,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
      
      // Verificar que la notificación es para este usuario
      if (notification.recipientId === user.id || notification.recipient?.id === user.id || notification.userId === user.id) {
        fetchNotifications({ page: 1, limit: 20 });

        // Toast notification
        toast.success(notification.title || 'Nueva notificación', {
          description: notification.message,
          duration: 5000,
        });

        // Mostrar notificación del navegador si está permitido
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: notification.actor?.avatar || '/icon.png',
            tag: notification.id,
            requireInteraction: notification.priority === 'high',
          });
        }
      } else {
        console.warn('[WS-Notifications] Notificación NO es para este usuario:', {
          notificationUserId: notification.userId || notification.recipientId,
          currentUserId: user.id
        });
      }
    };

    socket.on('newNotification', handleNewNotification);
    socket.on('new_notification', handleNewNotification);

    socket.on('notificationMarkedAsRead', (data: { notificationId: string }) => {
    });

    socket.on('allNotificationsMarkedAsRead', (data: { count: number }) => {
    });

    socket.on('error', (error: { message: string }) => {
    });

    socketRef.current = socket;

    return () => {

      isConnectingRef.current = false;
      socket.off('newNotification', handleNewNotification);
      socket.off('new_notification', handleNewNotification);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, fetchNotifications]);

  const connectToUsers = useCallback(() => {
    if (!isRealtimeEnabled()) return;
    if (!user?.id) {
      console.log('[WS-Users] No hay usuario autenticado');
      return;
    }

    // Evitar reconexiones duplicadas
    if (usersSocketRef.current?.connected) {
    
      return;
    }

    // Desconectar socket anterior si existe
    if (usersSocketRef.current) {
      usersSocketRef.current.disconnect();
      usersSocketRef.current = null;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }

    const socket = io(USERS_WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {});
    socket.on('disconnect', (reason) => {});
    socket.on('connect_error', (error) => {});

    socket.on('friend_request_received', (data: any) => {
      const fromProfile = data.data?.from || data.notification?.actor;
      const senderName = fromProfile
        ? `${fromProfile.firstName || fromProfile.username} ${fromProfile.lastName || ''}`.trim()
        : 'Alguien';

      toast.success(`${senderName} te envió una solicitud de amistad`, {
        duration: 5000,
        action: {
          label: 'Ver',
          onClick: () => window.location.href = '/feed/friends'
        }
      });

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nueva solicitud de amistad', {
          body: `${senderName} quiere ser tu amigo`,
          icon: fromProfile?.avatar || '/icon.png',
          tag: data.data?.requestId,
        });
      }

      fetchNotifications({ page: 1, limit: 10 });
      fetchPendingRequests();
    });

    // Nota: El evento 'friend_request_accepted' ahora se maneja en connectToFriendships()

    socket.on('notification_reaction', (notification: any) => {
      const actorName = notification.actor 
        ? `${notification.actor.firstName} ${notification.actor.lastName}`
        : 'Alguien';

      toast.success(notification.message, {
        duration: 5000,
        action: {
          label: 'Ver',
          onClick: () => window.location.href = notification.targetUrl || '/feed'
        }
      });

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: notification.actor?.avatar || '/icon.png',
          tag: notification.id,
        });
      }

      fetchNotifications({ page: 1, limit: 10 });
    });

    usersSocketRef.current = socket;

    return () => {
      socket.disconnect();
      usersSocketRef.current = null;
    };
  }, [user?.id, fetchNotifications, fetchPendingRequests]);

  const connectToFriendships = useCallback(() => {
    if (!isRealtimeEnabled()) return;
    if (!user?.id) {
      console.log(' No hay usuario autenticado');
      return;
    }

    // Evitar reconexiones duplicadas
    if (friendshipsSocketRef.current?.connected) {
      console.log(' Ya conectado, skipping...');
      return;
    }

    // Desconectar socket anterior si existe
    if (friendshipsSocketRef.current) {
      console.log('  Desconectando socket anterior...');
      friendshipsSocketRef.current.disconnect();
      friendshipsSocketRef.current = null;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }



    const socket = io(FRIENDSHIPS_WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('  Conectado');
    });
    
    socket.on('disconnect', (reason) => {
      console.log('  Desconectado:', reason);
    });
    
    socket.on('connect_error', (error) => {
      console.error('  Error de conexión:', error);
    });

    socket.on('friend_request_accepted', (data: any) => {
   
      
      const friendName = data.acceptorProfile
        ? `${data.acceptorProfile.firstName} ${data.acceptorProfile.lastName}`
        : 'Un usuario';

      toast.success(`${friendName} aceptó tu solicitud de amistad`, {
        duration: 5000,
      });

      // Eliminar la notificación de solicitud pendiente del store
      const notificationStore = useNotificationStore.getState();
      
      // Buscar notificación de FRIEND_REQUEST relacionada con este friendshipId
      const friendRequestNotification = notificationStore.notifications.find(
        n => n.type === NotificationType.FRIEND_REQUEST && 
             (n.targetUrl?.includes(data.friendshipId || '') || 
              n.targetUrl?.includes(data.id || ''))
      );

      if (friendRequestNotification) {
       
        notificationStore.removeNotificationFromList(friendRequestNotification.id);
        
        // Actualizar contador de no leídas
        if (!friendRequestNotification.isRead) {
          const currentCount = notificationStore.unreadCount;
          useNotificationStore.setState({ unreadCount: Math.max(0, currentCount - 1) });
        }
      }

      // Refrescar lista completa por si acaso
      fetchNotifications({ page: 1, limit: 10 });
      fetchPendingRequests();
    });

    // Evento: Solicitud rechazada
    socket.on('friend_request_rejected', (data: any) => {

      toast.info('Tu solicitud de amistad fue rechazada');

      // Eliminar la notificación de solicitud pendiente del store
      const notificationStore = useNotificationStore.getState();
      
      const friendRequestNotification = notificationStore.notifications.find(
        n => n.type === NotificationType.FRIEND_REQUEST && 
             (n.targetUrl?.includes(data.friendshipId || '') || 
              n.targetUrl?.includes(data.id || ''))
      );

      if (friendRequestNotification) {
    
        notificationStore.removeNotificationFromList(friendRequestNotification.id);
        
        if (!friendRequestNotification.isRead) {
          const currentCount = notificationStore.unreadCount;
          useNotificationStore.setState({ unreadCount: Math.max(0, currentCount - 1) });
        }
      }

      fetchNotifications({ page: 1, limit: 10 });
      fetchPendingRequests();
    });

    friendshipsSocketRef.current = socket;

    return () => {
      socket.disconnect();
      friendshipsSocketRef.current = null;
    };
  }, [user?.id, fetchNotifications, fetchPendingRequests]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
   
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (usersSocketRef.current) {
   
      usersSocketRef.current.disconnect();
      usersSocketRef.current = null;
    }
    if (friendshipsSocketRef.current) {
  
      friendshipsSocketRef.current.disconnect();
      friendshipsSocketRef.current = null;
    }
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    if (socketRef.current?.connected) {

      socketRef.current.emit('markAsRead', { notificationId });
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    if (socketRef.current?.connected) {

      socketRef.current.emit('markAllAsRead');
    }
  }, []);

  // Conectar automáticamente cuando hay usuario
  useEffect(() => {
   
    const cleanup = connect();
    const cleanupUsers = connectToUsers();
    const cleanupFriendships = connectToFriendships();
    
    return () => {
      if (cleanup) cleanup();
      if (cleanupUsers) cleanupUsers();
      if (cleanupFriendships) cleanupFriendships();
    };
  }, [connect, connectToUsers, connectToFriendships]);

  // Pedir permiso para notificaciones del navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        // Manejar el permiso otorgado o denegado
      });
    }
  }, []);

  return {
    socket: socketRef.current,
    usersSocket: usersSocketRef.current,
    friendshipsSocket: friendshipsSocketRef.current,
    isConnected: socketRef.current?.connected || false,
    isUsersConnected: usersSocketRef.current?.connected || false,
    isFriendshipsConnected: friendshipsSocketRef.current?.connected || false,
    connect,
    connectToUsers,
    connectToFriendships,
    disconnect,
    markAsRead,
    markAllAsRead,
  };
}
