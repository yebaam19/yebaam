import type { StoreApi } from 'zustand';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { notificationService } from '../services/notification.service';
import type { NotificationState } from './notification-state';

type WriteActions = Pick<NotificationState,
  'markAsRead' | 'markOneAsRead' | 'markAllAsRead' | 'deleteNotification' | 'deleteMany' | 'updatePreferences'>;

export function notificationWriteActions(
  set: StoreApi<NotificationState>['setState'],
  get: StoreApi<NotificationState>['getState'],
): WriteActions {
  const begin = () => {
    const userId = useAuthStore.getState().user?.id;
    const sessionVersion = get().sessionVersion;
    set({ pendingWrites: get().pendingWrites + 1, revision: get().revision + 1, lastFetchedAt: 0 });
    // Protect callbacks even if the same account signs out and back in.
    return () => useAuthStore.getState().user?.id === userId && get().sessionVersion === sessionVersion;
  };
  const finish = (isCurrent: () => boolean) => {
    if (!isCurrent()) return;
    set({ pendingWrites: get().pendingWrites - 1, revision: get().revision + 1 });
    if (!get().pendingWrites) void get().fetchNotifications({ ...get().activeFilters, page: 1, before: undefined }, true);
  };
  const markRead = async (ids?: string[]) => {
    if (!ids && get().pendingWrites) return;
    const previous = get().notifications.filter(n => !n.isRead && (!ids || ids.includes(n.id)));
    const previousById = new Map(previous.map(n => [n.id, n]));
    const decrement = ids ? previous.length : get().unreadCount;
    if (!decrement) return;
    const isCurrent = begin();
    const readAt = new Date().toISOString();
    set({
      notifications: get().notifications.map(n => previousById.has(n.id) ? { ...n, isRead: true, readAt } : n),
      unreadCount: Math.max(0, get().unreadCount - decrement),
    });
    try {
      if (ids) await notificationService.markAsRead(previous.map(n => n.id));
      else await notificationService.markAllAsRead(readAt);
    } catch {
      if (!isCurrent()) return;
      // Roll back only this operation, preserving new arrivals and other changes.
      set({
        notifications: get().notifications.map(n =>
          n.readAt === readAt && previousById.has(n.id) ? previousById.get(n.id)! : n),
        unreadCount: get().unreadCount + decrement,
      });
      toast.error('No se pudo marcar como leído. Inténtalo de nuevo.');
    } finally { finish(isCurrent); }
  };
  const remove = async (ids: string[]) => {
    const existing = get().notifications.filter(n => ids.includes(n.id));
    if (!existing.length) return;
    const isCurrent = begin();
    try {
      await notificationService.deleteMany(existing.map(n => n.id));
      if (!isCurrent()) return;
      const unreadDeleted = get().notifications.filter(n => ids.includes(n.id) && !n.isRead).length;
      set({ notifications: get().notifications.filter(n => !ids.includes(n.id)),
        unreadCount: Math.max(0, get().unreadCount - unreadDeleted) });
      toast.success('Notificación eliminada');
    } catch {
      if (isCurrent()) toast.error('Error al eliminar notificación');
    } finally { finish(isCurrent); }
  };
  return {
    markAsRead: ids => markRead(ids),
    markOneAsRead: id => markRead([id]),
    markAllAsRead: () => markRead(),
    deleteNotification: id => remove([id]),
    deleteMany: remove,
    updatePreferences: async preferences => {
      const isCurrent = begin();
      try {
        const updated = await notificationService.updatePreferences(preferences);
        if (isCurrent()) set({ preferences: updated });
      } catch {
        if (isCurrent()) toast.error('Error al actualizar preferencias');
      } finally { finish(isCurrent); }
    },
  };
}
