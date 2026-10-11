import type { Notification, NotificationStats, NotificationPreferences, GetNotificationsFilters } from '../interfaces/notification.interfaces';

export interface NotificationState {
  // Estado
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  
  activeFilters: GetNotificationsFilters;
  lastFetchedAt: number;
  revision: number;
  sessionVersion: number;
  pendingWrites: number;

  // Paginación
  currentPage: number;
  hasMore: boolean;
  
  // Polling
  isPolling: boolean;
  pollingInterval: number; // en ms
  
  // Acciones de lectura
  fetchNotifications: (filters?: GetNotificationsFilters, force?: boolean) => Promise<void>;
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

