/**
 * Notification Store
 * 
 * Store global de Zustand para gestionar notificaciones.
 * 
 * Responsabilidades:
 * - Estado global de notificaciones
 * - Contador de no leídas
 * - Polling automático
 * - Acciones de lectura/eliminación
 */

'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from 'sonner';
import { notificationService } from '../services/notification.service';
import type {
  Notification,
  NotificationStats,
  NotificationPreferences,
  GetNotificationsFilters,
} from '../interfaces/notification.interfaces';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface NotificationState {
  // Estado
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  
  // Paginación
  currentPage: number;
  hasMore: boolean;
  
  // Polling
  isPolling: boolean;
  pollingInterval: number; // en ms
  
  // Acciones de lectura
  fetchNotifications: (filters?: GetNotificationsFilters) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchPreferences: () => Promise<void>;
  loadMore: () => Promise<void>;
  
  // Acciones de escritura
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markOneAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteMany: (notificationIds: string[]) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  
  // Polling
  startPolling: () => void;
  stopPolling: () => void;
  
  // Utilidades
  clearError: () => void;
  reset: () => void;
  updateNotificationInList: (notificationId: string, updates: Partial<Notification>) => void;
  removeNotificationFromList: (notificationId: string) => void;
}

const initialState = {
  notifications: [],
  unreadCount: 0,
  stats: null,
  preferences: null,
  isLoading: false,
  error: null,
  currentPage: 1,
  hasMore: true,
  isPolling: false,
  pollingInterval: 30000, // 30 segundos
};

// Variable para almacenar el intervalo de polling
let pollingIntervalId: NodeJS.Timeout | null = null;

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ============================================
      // Acciones de lectura
      // ============================================

      fetchNotifications: async (filters?: GetNotificationsFilters) => {
       
        set({ isLoading: true, error: null });
        try {
        
          const response = await notificationService.getAll(filters);
        
          //  SECURITY FILTER: Ensure we only show notifications for the current user
          const currentUser = useAuthStore.getState().user;
          if (!currentUser?.id) {
            
            set({ isLoading: false, error: 'No authenticated user' });
            return;
          }

          // Filter out any notifications that don't belong to the current user
          const safeNotifications = response.notifications.filter(notification => {
            const belongsToUser = notification.userId === currentUser.id;
            if (!belongsToUser) {
              // Log security alert
            }
            return belongsToUser;
          });


     
          set({
            notifications: filters?.page === 1 
              ? safeNotifications 
              : [...get().notifications, ...safeNotifications],
            unreadCount: response.pagination.unreadCount,
            currentPage: response.pagination.page,
            hasMore: response.pagination.hasMore,
            isLoading: false,
          });
          
   
        } catch (error: any) {
          const errorMessage = error.message || 'Error al cargar notificaciones';
          set({ error: errorMessage, isLoading: false });
        }
      },

      fetchStats: async () => {
        try {
          // TODO: Implementar cuando el backend tenga el endpoint /api/notifications/stats
          // const stats = await notificationService.getStats();
          // set({ stats, unreadCount: stats.unreadCount });
          
          // Por ahora solo actualizamos desde las notificaciones cargadas
          const notifications = get().notifications;
          const unreadCount = notifications.filter(n => !n.isRead).length;
          set({ unreadCount });
        } catch (error: any) {
          console.error('Error al cargar estadísticas:', error);
        }
      },

      fetchPreferences: async () => {
        try {
          const preferences = await notificationService.getPreferences();
          set({ preferences });
        } catch (error: any) {
          console.error('Error al cargar preferencias:', error);
        }
      },

      loadMore: async () => {
        const { currentPage, hasMore, isLoading } = get();
        
        if (!hasMore || isLoading) return;
        
        await get().fetchNotifications({ page: currentPage + 1 });
      },

      // ============================================
      // Acciones de escritura
      // ============================================

      markAsRead: async (notificationIds: string[]) => {
        const existingIds = notificationIds.filter(id =>
          get().notifications.some(n => n.id === id)
        );
        if (existingIds.length === 0) return;

        // Optimistic local flip — avoids any flash of unread-state during
        // nav/refetch. Rolled back if the DB write truly failed.
        const prev = get().notifications;
        const prevUnread = get().unreadCount;
        const readAt = new Date().toISOString();
        set({
          notifications: prev.map(n =>
            existingIds.includes(n.id) ? { ...n, isRead: true, readAt } : n
          ),
          unreadCount: Math.max(
            0,
            prevUnread - prev.filter(n => existingIds.includes(n.id) && !n.isRead).length
          ),
        });

        try {
          await notificationService.markAsRead(existingIds);
        } catch (error: any) {
          const msg = error?.message ?? '';
          if (msg === 'notification_not_updated' || error?.response?.status === 404) {
            // Row already gone / already read — keep the local flip, stay quiet.
            return;
          }
          // Real failure: roll back optimistic flip and surface it.
          set({ notifications: prev, unreadCount: prevUnread });
          toast.error('Error al marcar como leídas');
        }
      },

      markOneAsRead: async (notificationId: string) => {
        await get().markAsRead([notificationId]);
      },

      markAllAsRead: async () => {
        try {
          await notificationService.markAllAsRead();
          
          // Marcar todas como leídas en el estado local
          const now = new Date().toISOString();
          set({
            notifications: get().notifications.map(notification => ({
              ...notification,
              isRead: true,
              readAt: now,
            })),
            unreadCount: 0,
          });
          
          toast.success('Todas las notificaciones marcadas como leídas');
        } catch (error: any) {
          toast.error('Error al marcar todas como leídas');
        }
      },

      deleteNotification: async (notificationId: string) => {
        try {
          const notification = get().notifications.find(n => n.id === notificationId);
          
          if (!notification) return;
          
          await notificationService.delete(notificationId);
          
          get().removeNotificationFromList(notificationId);
          
          if (!notification.isRead) {
            set({ unreadCount: Math.max(0, get().unreadCount - 1) });
          }
          
          toast.success('Notificación eliminada');
        } catch (error: any) {
          if (error.response?.status === 404) {
            get().removeNotificationFromList(notificationId);
          } else {
            toast.error('Error al eliminar notificación');
          }
        }
      },

      deleteMany: async (notificationIds: string[]) => {
        try {
          const existingIds = notificationIds.filter(id => 
            get().notifications.some(n => n.id === id)
          );
          
          if (existingIds.length === 0) return;
          
          await notificationService.deleteMany(existingIds);
          
          const unreadDeleted = get().notifications.filter(
            n => existingIds.includes(n.id) && !n.isRead
          ).length;
          
          existingIds.forEach(id => get().removeNotificationFromList(id));
          
          set({ unreadCount: Math.max(0, get().unreadCount - unreadDeleted) });
          
          toast.success(`${existingIds.length} notificaciones eliminadas`);
        } catch (error: any) {
          if (error.response?.status !== 404) {
            toast.error('Error al eliminar notificaciones');
          }
        }
      },

      updatePreferences: async (preferences: Partial<NotificationPreferences>) => {
        try {
          const updated = await notificationService.updatePreferences(preferences);
          set({ preferences: updated });
          toast.success('Preferencias actualizadas');
        } catch (error: any) {
          toast.error('Error al actualizar preferencias');
        }
      },

      // ============================================
      // Polling
      // ============================================

      startPolling: () => {
        const { isPolling, pollingInterval } = get();
        
        if (isPolling) return; // Ya está corriendo
        
        set({ isPolling: true });
        
        // Polling inicial
        get().fetchStats();
        
        // Configurar intervalo
        pollingIntervalId = setInterval(() => {
          get().fetchStats();
        }, pollingInterval);
      },

      stopPolling: () => {
        if (pollingIntervalId) {
          clearInterval(pollingIntervalId);
          pollingIntervalId = null;
        }
        set({ isPolling: false });
      },

      // ============================================
      // Utilidades
      // ============================================

      clearError: () => set({ error: null }),

      reset: () => {
        get().stopPolling();
        set(initialState);
      },

      updateNotificationInList: (notificationId: string, updates: Partial<Notification>) => {
        set({
          notifications: get().notifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, ...updates }
              : notification
          ),
        });
      },

      removeNotificationFromList: (notificationId: string) => {
        set({
          notifications: get().notifications.filter(n => n.id !== notificationId),
        });
      },
    }),
    { name: 'NotificationStore' }
  )
);
