import type { SocketEvent } from './socket-event-types';

export const POST_EVENTS: SocketEvent[] = [
  {
    name: 'post_created', //  CORREGIDO: era 'post:created'
    category: 'posts',
    description: 'Nuevo post creado',
    icon: '',
    color: 'green',
    isIncoming: true,
  },
  {
    name: 'post_updated', //  CORREGIDO: era 'post:updated'
    category: 'posts',
    description: 'Post actualizado',
    icon: '',
    color: 'blue',
    isIncoming: true,
  },
  {
    name: 'post_deleted', //  CORREGIDO: era 'post:deleted'
    category: 'posts',
    description: 'Post eliminado',
    icon: '',
    color: 'red',
    isIncoming: true,
  },
  {
    name: 'post_add_reaction', //  CORREGIDO: era 'post:reaction'
    category: 'posts',
    description: 'Nueva reacción agregada',
    icon: '',
    color: 'pink',
    isIncoming: true,
  },
  {
    name: 'post_remove_reaction', //  NUEVO: reacción removida
    category: 'posts',
    description: 'Reacción removida',
    icon: '',
    color: 'gray',
    isIncoming: true,
  },
  {
    name: 'post_upload_media', //  NUEVO: media agregada
    category: 'posts',
    description: 'Archivos multimedia agregados',
    icon: '',
    color: 'purple',
    isIncoming: true,
  },
  {
    name: 'post_replace_media', //  NUEVO: media reemplazada
    category: 'posts',
    description: 'Archivos multimedia reemplazados',
    icon: '',
    color: 'blue',
    isIncoming: true,
  },
  {
    name: 'post_remove_media', //  NUEVO: media removida
    category: 'posts',
    description: 'Archivo multimedia removido',
    icon: '',
    color: 'red',
    isIncoming: true,
  },
  {
    name: 'post:comment', // Mantener este por ahora (no está en backend aún)
    category: 'posts',
    description: 'Nuevo comentario en post',
    icon: '',
    color: 'purple',
    isIncoming: true,
  },
];

/**
 * Eventos de NOTIFICACIONES
 */
export const NOTIFICATION_EVENTS: SocketEvent[] = [
  {
    name: 'notification:new',
    category: 'notifications',
    description: 'Nueva notificación',
    icon: '',
    color: 'blue',
    isIncoming: true,
  },
  {
    name: 'notification:read',
    category: 'notifications',
    description: 'Notificación leída',
    icon: '',
    color: 'green',
    isIncoming: true,
  },
];

/**
 * Eventos de MENSAJES
 */
export const MESSAGE_EVENTS: SocketEvent[] = [
  {
    name: 'message:new',
    category: 'messages',
    description: 'Nuevo mensaje recibido',
    icon: '',
    color: 'purple',
    isIncoming: true,
  },
  {
    name: 'message:read',
    category: 'messages',
    description: 'Mensaje leído',
    icon: '',
    color: 'blue',
    isIncoming: true,
  },
  {
    name: 'message:delivered',
    category: 'messages',
    description: 'Mensaje entregado',
    icon: '',
    color: 'neutral',
    isIncoming: true,
  },
];

/**
 * Eventos de USUARIOS
 */
