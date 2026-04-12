
import { getAxiosInstance } from '@/lib/axios/axiosInstance';
import type {
  Notification,
  NotificationsResponse,
  NotificationStats,
  NotificationPreferences,
  GetNotificationsFilters,
  MarkAsReadDTO,
  UpdatePreferencesDTO,
} from '../interfaces/notification.interfaces';

/**
 * Endpoints del API de notificaciones
 */
const NOTIFICATION_ENDPOINTS = {
  NOTIFICATIONS: '/api/notifications',
  NOTIFICATION_BY_ID: (id: string) => `/api/notifications/${id}`,
  MARK_AS_READ: (id: string) => `/api/notifications/${id}/read`,
  MARK_MULTIPLE_AS_READ: '/api/notifications/read/multiple',
  MARK_ALL_AS_READ: '/api/notifications/mark-all-as-read',
  STATS: '/api/notifications/stats',
  PREFERENCES: '/api/notifications/preferences',
  SUBSCRIBE_PUSH: '/api/notifications/subscribe-push',
} as const;

export class NotificationService {
  private readonly axios = getAxiosInstance();

  /**
   * Obtiene todas las notificaciones con filtros y paginación
   * 
   * Las notificaciones vienen directamente del backend (MongoDB).
   * El backend ya incluye las notificaciones de friend requests.
   * 
   * @param filters - Filtros opcionales
   * @returns Lista paginada de notificaciones
   */
  async getAll(filters?: GetNotificationsFilters): Promise<NotificationsResponse> {
    try {
      const params = this.buildQueryParams(filters);
      const response = await this.axios.get<any>(
        NOTIFICATION_ENDPOINTS.NOTIFICATIONS,
        { params }
      );

      // El backend devuelve { success: true, data: [...], pagination: {...}, summary: {...} }
      const notifications = (response.data?.data || [])
        .map((notification: any) => {
          const mapped = {
            ...notification,
            id: notification.id || notification._id,
            // Fusionar metadata y data para tener todos los campos disponibles
            metadata: {
              ...(notification.metadata || {}),
              ...(notification.data || {}),
            },
            targetUrl: notification.actionUrl || notification.targetUrl, // Mapear actionUrl a targetUrl
          };
          
          // Log para debug de friend requests
          if (notification.type === 'FRIEND_REQUEST' || notification.type === 'friend_request') {
            console.log('[NotificationService] Friend Request Notification:', {
              id: mapped.id,
              actionUrl: notification.actionUrl,
              targetUrl: mapped.targetUrl,
              metadata: mapped.metadata,
              originalData: notification.data,
              actor: notification.actor
            });
          }
          
          return mapped;
        })
        .filter((n: any) => n.id); //TODO: TIPAR Filtrar notificaciones sin ID

      const backendPagination = response.data?.pagination || {};
      const summary = response.data?.summary || {};

      return {
        notifications,
        pagination: {
          total: backendPagination.total || notifications.length,
          page: filters?.page || 1,
          limit: filters?.limit || 10,
          hasMore: backendPagination.hasMore || false,
          unreadCount: summary.unreadCount || notifications.filter((n: any) => !n.isRead).length,
        },
      };
    } catch (error) {
      throw this.handleError(error, 'Error al obtener notificaciones');
    }
  }

  /**
   * Obtiene una notificación específica por ID
   * 
   * @param notificationId - ID de la notificación
   * @returns Notificación encontrada
   */
  async getById(notificationId: string): Promise<Notification> {
    try {
      const response = await this.axios.get<Notification>(
        NOTIFICATION_ENDPOINTS.NOTIFICATION_BY_ID(notificationId)
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener notificación');
    }
  }

  /**
   * Obtiene estadísticas de notificaciones
   * 
   * @returns Estadísticas (total, no leídas, por tipo)
   */
  async getStats(): Promise<NotificationStats> {
    try {
      const response = await this.axios.get<NotificationStats>(
        NOTIFICATION_ENDPOINTS.STATS
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener estadísticas');
    }
  }

  /**
   * Marca notificaciones específicas como leídas
   * 
   * @param notificationIds - IDs de las notificaciones a marcar
   */
  async markAsRead(notificationIds: string[]): Promise<void> {
    try {
      await this.axios.patch(NOTIFICATION_ENDPOINTS.MARK_MULTIPLE_AS_READ, {
        notificationIds,
      } as MarkAsReadDTO);
    } catch (error) {
      throw this.handleError(error, 'Error al marcar como leídas');
    }
  }

  /**
   * Marca una sola notificación como leída
   * 
   * @param notificationId - ID de la notificación
   */
  async markOneAsRead(notificationId: string): Promise<void> {
    try {
      await this.axios.patch(NOTIFICATION_ENDPOINTS.MARK_AS_READ(notificationId));
    } catch (error) {
      throw this.handleError(error, 'Error al marcar como leída');
    }
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  async markAllAsRead(): Promise<void> {
    try {
      await this.axios.patch(NOTIFICATION_ENDPOINTS.MARK_ALL_AS_READ);
    } catch (error) {
      throw this.handleError(error, 'Error al marcar todas como leídas');
    }
  }

  /**
   * Elimina una notificación
   * 
   * @param notificationId - ID de la notificación a eliminar
   */
  async delete(notificationId: string): Promise<void> {
    try {
      await this.axios.delete(
        NOTIFICATION_ENDPOINTS.NOTIFICATION_BY_ID(notificationId)
      );
    } catch (error) {
      throw this.handleError(error, 'Error al eliminar notificación');
    }
  }

  /**
   * Elimina múltiples notificaciones
   * 
   * @param notificationIds - IDs de las notificaciones a eliminar
   */
  async deleteMany(notificationIds: string[]): Promise<void> {
    try {
      await this.axios.delete(`${NOTIFICATION_ENDPOINTS.NOTIFICATIONS}/multiple`, {
        data: { notificationIds },
      });
    } catch (error) {
      throw this.handleError(error, 'Error al eliminar notificaciones');
    }
  }

  /**
   * Obtiene las preferencias de notificaciones del usuario
   * 
   * @returns Preferencias actuales
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await this.axios.get<NotificationPreferences>(
        NOTIFICATION_ENDPOINTS.PREFERENCES
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al obtener preferencias');
    }
  }

  /**
   * Actualiza las preferencias de notificaciones
   * 
   * @param preferences - Preferencias a actualizar
   * @returns Preferencias actualizadas
   */
  async updatePreferences(
    preferences: UpdatePreferencesDTO
  ): Promise<NotificationPreferences> {
    try {
      const response = await this.axios.patch<NotificationPreferences>(
        NOTIFICATION_ENDPOINTS.PREFERENCES,
        preferences
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al actualizar preferencias');
    }
  }

  /**
   * Suscribe al usuario a notificaciones push
   * 
   * @param subscription - Datos de suscripción push
   */
  async subscribeToPush(subscription: PushSubscription): Promise<void> {
    try {
      await this.axios.post(NOTIFICATION_ENDPOINTS.SUBSCRIBE_PUSH, {
        subscription: subscription.toJSON(),
      });
    } catch (error) {
      throw this.handleError(error, 'Error al suscribirse a notificaciones push');
    }
  }


  private buildQueryParams(filters?: GetNotificationsFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    // Convertir page a offset (backend usa offset, no page)
    if (filters.page && filters.limit) {
      params.offset = (filters.page - 1) * filters.limit;
    }
    if (filters.limit) params.limit = filters.limit;
    if (filters.type) params.type = filters.type;
    
    // Usar el filtro directamente si está presente
    if (filters.filter) {
      params.filter = filters.filter;
    } else if (filters.isRead !== undefined) {
      // Convertir isRead a filter (backend usa filter='read' o 'unread')
      params.filter = filters.isRead === false ? 'unread' : filters.isRead === true ? 'read' : 'all';
    } else {
      params.filter = 'all';
    }
    
    if (filters.since) params.since = filters.since;

    return params;
  }

  /**
   * Maneja errores de HTTP
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error instanceof Error && !error.message.includes('AxiosError')) {
      return error;
    }

    const backendMessage = error?.response?.data?.message;
    if (backendMessage) {
      return new Error(backendMessage);
    }

    return new Error(defaultMessage);
  }
}

/**
 * Instancia singleton del servicio
 */
export const notificationService = new NotificationService();
