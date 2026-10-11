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
import { notificationWriteActions } from './notification-write-actions';
import { notificationError } from '../services/notification-error';
import type { NotificationState } from './notification-state';
import { notificationService } from '../services/notification.service';
import type {
  Notification,
  GetNotificationsFilters,
} from '../interfaces/notification.interfaces';
import { useAuthStore } from '@/features/auth/store/auth.store';

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
          
   
        } catch (error) {
          const errorMessage = notificationError(error).message || 'Error al cargar notificaciones';
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
        } catch (error) {
          console.error('Error al cargar estadísticas:', error);
        }
      },

      fetchPreferences: async () => {
        try {
          const preferences = await notificationService.getPreferences();
          set({ preferences });
        } catch (error) {
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

      ...notificationWriteActions(set, get),

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
