import type { StoreApi } from 'zustand';
import { toast } from 'sonner';
import { notificationService } from '../services/notification.service';
import { notificationError } from '../services/notification-error';
import type { NotificationPreferences } from '../interfaces/notification.interfaces';
import type { NotificationState } from './notification-state';

type WriteActions = Pick<NotificationState,
  'markAsRead' | 'markOneAsRead' | 'markAllAsRead' | 'deleteNotification' | 'deleteMany' | 'updatePreferences'>;

export function notificationWriteActions(
  set: StoreApi<NotificationState>['setState'],
  get: StoreApi<NotificationState>['getState'],
): WriteActions {
  return {
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
        } catch (error) {
          const msg = notificationError(error).message;
          if (msg === 'notification_not_updated' || notificationError(error).status === 404) {
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
        } catch {
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
        } catch (error) {
          if (notificationError(error).status === 404) {
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
        } catch (error) {
          if (notificationError(error).status !== 404) {
            toast.error('Error al eliminar notificaciones');
          }
        }
      },

      updatePreferences: async (preferences: Partial<NotificationPreferences>) => {
        try {
          const updated = await notificationService.updatePreferences(preferences);
          set({ preferences: updated });
          toast.success('Preferencias actualizadas');
        } catch {
          toast.error('Error al actualizar preferencias');
        }
      },

  };
}
