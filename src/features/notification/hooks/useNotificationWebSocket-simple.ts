/**
 * Notification WebSocket Hook
 * 
 * Hook para manejar la conexión WebSocket de notificaciones en tiempo real.
 */

'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '../store/notification.store';
import { useAuthStore } from '@/features/auth/store/auth.store';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const WEBSOCKET_URL = `${BACKEND_URL}/notifications`;

export function useNotificationWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuthStore();
  const { fetchNotifications } = useNotificationStore();

  useEffect(() => {
    // Solo conectar si hay usuario
    if (!user?.id) {
      console.log('[NotificationWS] No hay usuario, no conectar');
      return;
    }

    console.log(`[NotificationWS] Conectando a ${WEBSOCKET_URL} para usuario ${user.id}...`);

    const socket = io(WEBSOCKET_URL, {
      query: { userId: user.id },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      socket.emit('join_notification_room', { userId: user.id }, (response: any) => {
        if (response?.success) {
     
        } else {
          console.error('Error al unirse a la room:', response);
        }
      });
      

      fetchNotifications({ page: 1, limit: 10 });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[NotificationWS]  Desconectado: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      console.error('[NotificationWS]  Error:', error);
    });

    // Nueva notificación en tiempo real (evento con guión bajo del backend)
    socket.on('new_notification', (notification: any) => {
      fetchNotifications({ page: 1, limit: 10 });

      // Notificación del navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: notification.actor?.avatar || '/icon.png',
          tag: notification.id,
        });
      }
    });

    // Mantener compatibilidad con camelCase por si acaso
    socket.on('newNotification', (notification: any) => {
      fetchNotifications({ page: 1, limit: 10 });
    });

    socketRef.current = socket;

    return () => {

      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, fetchNotifications]);

  // Pedir permiso para notificaciones del navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('[NotificationWS] Permiso:', permission);
      });
    }
  }, []);

  return {
    isConnected: socketRef.current?.connected || false,
  };
}
