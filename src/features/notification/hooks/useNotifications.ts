/**
 * useNotifications Hook
 * 
 * PISO 3 - Hook de dominio para notificaciones
 * 
 * Este hook es la interfaz principal entre la UI (PISO 5) y el store (PISO 4).
 * Expone solo lo necesario para la UI y encapsula la lógica de negocio.
 */

'use client';

import { useNotificationStore } from '../store/notification.store';
import type { Notification, GetNotificationsFilters } from '../interfaces/notification.interfaces';

/**
 * Hook principal para gestionar notificaciones
 * 
 * @example
 * ```tsx
 * const { notifications, unreadCount, fetchNotifications } = useNotifications();
 * ```
 */
export function useNotifications() {
  const {
    notifications,
    unreadCount,
    stats,
    isLoading,
    error,
    
    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  /**
   * Obtener notificaciones filtradas por tipo
   */
  const getNotificationsByType = (type: string) => {
    return notifications.filter(notif => notif.type === type);
  };

  /**
   * Obtener solo notificaciones no leídas
   */
  const getUnreadNotifications = () => {
    return notifications.filter(notif => !notif.isRead);
  };

  /**
   * Obtener notificaciones de solicitudes de amistad no leídas
   */
  const getFriendRequestNotifications = () => {
    return notifications.filter(
      notif => notif.type === 'FRIEND_REQUEST' && !notif.isRead
    );
  };

  /**
   * Refrescar notificaciones con filtros opcionales
   */
  const refreshNotifications = async (filters?: GetNotificationsFilters) => {
    await fetchNotifications(filters);
  };

  return {
    // Estado
    notifications,
    unreadCount,
    stats,
    isLoading,
    error,

    // Notificaciones filtradas
    getNotificationsByType,
    getUnreadNotifications,
    getFriendRequestNotifications,

    // Acciones
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
