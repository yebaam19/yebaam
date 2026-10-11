'use client';

import { useBrowserNotificationPermission } from '@/features/chat/hooks/useBrowserNotificationPermission';
import { playNotificationSound } from '@/features/chat/lib/notificationSound';
import { useState, useCallback } from 'react';

interface MessageNotification {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  conversationId: string;
}

export function useMessageNotifications() {
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);
  const hasPermission = useBrowserNotificationPermission();



  // Agregar una notificación
  const addNotification = useCallback((notification: MessageNotification) => {
    setNotifications((prev) => [...prev, notification]);

    // Notificación del navegador (si la pestaña no está activa)
    if (hasPermission && document.hidden) {
      const browserNotification = new Notification(notification.senderName, {
        body: notification.message,
        icon: notification.senderAvatar || '/default-avatar.png',
        tag: notification.conversationId, // Evita duplicados
        requireInteraction: false,
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };

      // Auto cerrar después de 5 segundos
      setTimeout(() => browserNotification.close(), 5000);
    }

    // Reproducir sonido
    playNotificationSound();
  }, [hasPermission]);

  // Remover una notificación
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Limpiar todas las notificaciones
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Reproducir sonido de notificación


  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    hasPermission,
  };
}
