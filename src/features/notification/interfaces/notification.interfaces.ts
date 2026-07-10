/**
 * Tipos e Interfaces para el módulo de Notificaciones
 * 
 * Define la estructura de datos de notificaciones,
 * tipos de eventos y preferencias del usuario
 */

/**
 * Tipos de notificaciones disponibles
 */
export enum NotificationType {
  // Interacciones con posts
  POST_LIKE = 'POST_LIKE',                 // Alguien reaccionó a tu post
  POST_COMMENT = 'POST_COMMENT',           // Alguien comentó tu post
  POST_SHARE = 'POST_SHARE',               // Alguien compartió tu post
  
  // Interacciones con comentarios
  COMMENT_LIKE = 'COMMENT_LIKE',           // Alguien reaccionó a tu comentario
  COMMENT_REPLY = 'COMMENT_REPLY',         // Alguien respondió tu comentario
  
  // Menciones y etiquetas
  POST_MENTION = 'POST_MENTION',           // Te mencionaron en un post
  COMMENT_MENTION = 'COMMENT_MENTION',     // Te mencionaron en un comentario
  POST_TAG = 'POST_TAG',                   // Te etiquetaron en un post
  
  // Amigos
  FRIEND_REQUEST = 'FRIEND_REQUEST',       // Solicitud de amistad
  FRIEND_ACCEPTED = 'FRIEND_ACCEPTED',     // Solicitud aceptada
  FRIEND_SUGGESTION = 'FRIEND_SUGGESTION', // Sugerencia de amigo
  
  // Grupos
  GROUP_INVITE = 'GROUP_INVITE',           // Invitación a grupo
  GROUP_POST = 'GROUP_POST',               // Nuevo post en grupo
  GROUP_JOIN = 'GROUP_JOIN',               // Alguien se unió a tu grupo
  
  // Eventos
  EVENT_INVITE = 'EVENT_INVITE',           // Invitación a evento
  EVENT_REMINDER = 'EVENT_REMINDER',       // Recordatorio de evento
  
  // Mensajes
  NEW_MESSAGE = 'NEW_MESSAGE',             // Nuevo mensaje directo
  
  // Club de coleccionistas
  MUSIC_ARTICLE_PUBLISHED = 'MUSIC_ARTICLE_PUBLISHED', // Nuevo artículo en un club al que perteneces

  // Páginas (PDF §10)
  PAGE_FOLLOW = 'PAGE_FOLLOW',
  PAGE_RECOMMEND = 'PAGE_RECOMMEND',
  PAGE_LIKE = 'PAGE_LIKE',
  PAGE_MESSAGE = 'PAGE_MESSAGE',
  PAGE_AUDITION = 'PAGE_AUDITION',
  PAGE_EVENT = 'PAGE_EVENT',

  // Sistema
  SYSTEM = 'SYSTEM',                       // Notificación del sistema
  ANNOUNCEMENT = 'ANNOUNCEMENT',           // Anuncio importante
}

/**
 * Actor de una notificación (quien realizó la acción)
 */
export interface NotificationActor {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  isVerified?: boolean;
}

/**
 * Metadatos adicionales según el tipo de notificación
 */
export interface NotificationMetadata {
  // Para posts
  postId?: string;
  postPreview?: string;
  postImageUrl?: string;
  
  // Para comentarios
  commentId?: string;
  commentPreview?: string;
  
  // Para grupos
  groupId?: string;
  groupName?: string;
  groupImageUrl?: string;
  
  // Para eventos
  eventId?: string;
  eventName?: string;
  eventDate?: string;
  
  // Para mensajes
  conversationId?: string;
  messagePreview?: string;

  // Para solicitudes de amistad
  friendshipId?: string;
  
  // Contadores (cuando hay múltiples actores)
  actorsCount?: number;
  additionalActors?: NotificationActor[];
}

/**
 * Notificación completa
 */
export interface Notification {
  id: string;
  userId: string; 
  type: NotificationType;
  actor: NotificationActor;
  message: string;
  metadata: NotificationMetadata;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  
  // URL de destino al hacer clic
  targetUrl?: string;
}

/**
 * Preferencias de notificaciones del usuario
 */
export interface NotificationPreferences {
  // Notificaciones push
  pushEnabled: boolean;
  
  // Notificaciones por email
  emailEnabled: boolean;
  emailFrequency: 'INSTANT' | 'DAILY' | 'WEEKLY' | 'NEVER';
  
  // Tipos de notificaciones habilitadas
  enabledTypes: {
    [key in NotificationType]?: boolean;
  };
  
  // Horario de silencio
  quietHours?: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string;   // "08:00"
  };
}

/**
 * Respuesta paginada de notificaciones
 */
export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    unreadCount: number;
    hasMore: boolean;
  };
}

/**
 * Filtros para obtener notificaciones
 */
export interface GetNotificationsFilters {
  page?: number;
  limit?: number;
  filter?: 'all' | 'unread' | 'read' | 'recent' | 'deleted';
  type?: NotificationType;
  isRead?: boolean;
  since?: string; // ISO date
}

/**
 * DTO para marcar notificaciones como leídas
 */
export interface MarkAsReadDTO {
  notificationIds: string[];
}

/**
 * DTO para actualizar preferencias
 */
export interface UpdatePreferencesDTO extends Partial<NotificationPreferences> {}

/**
 * Estadísticas de notificaciones
 */
export interface NotificationStats {
  totalCount: number;
  unreadCount: number;
  countByType: Record<NotificationType, number>;
  lastNotificationAt?: string;
}
