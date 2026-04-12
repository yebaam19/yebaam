/**
 * Notification Module
 * 
 * Módulo completo de notificaciones con store, servicios y componentes.
 * 
 * @example
 * ```tsx
 * import { NotificationBell, useNotifications } from '@/features/notification';
 * ```
 */

// Componentes
export { default as NotificationBell } from './components/NotificationBell';
export { default as NotificationItem } from './components/NotificationItem';

// Hooks (PISO 3 - Interfaz principal para la UI)
export { useNotifications } from './hooks/useNotifications';

// Store (PISO 4 - No debería usarse directamente desde UI)
export { useNotificationStore } from './store/notification.store';

// Servicios
export { notificationService, NotificationService } from './services/notification.service';

// Interfaces y tipos
export type {
  Notification,
  NotificationActor,
  NotificationMetadata,
  NotificationPreferences,
  NotificationsResponse,
  NotificationStats,
  GetNotificationsFilters,
  MarkAsReadDTO,
  UpdatePreferencesDTO,
} from './interfaces/notification.interfaces';

export { NotificationType } from './interfaces/notification.interfaces';
