import type { SocketEvent } from '@/socket/socket-event-types';
import { POST_EVENTS, NOTIFICATION_EVENTS, MESSAGE_EVENTS } from '@/socket/socket-content-events';
import { USER_EVENTS, FRIEND_EVENTS } from '@/socket/socket-people-events';
import { TYPING_EVENTS, ROOM_EVENTS, SYSTEM_EVENTS } from '@/socket/socket-channel-events';

export type { SocketEvent } from '@/socket/socket-event-types';
export { POST_EVENTS, NOTIFICATION_EVENTS, MESSAGE_EVENTS, USER_EVENTS, FRIEND_EVENTS, TYPING_EVENTS, ROOM_EVENTS, SYSTEM_EVENTS };
export { SAMPLE_PAYLOADS } from '@/socket/socket-sample-payloads';

/**
 * TODOS los eventos combinados
 */
export const ALL_SOCKET_EVENTS: SocketEvent[] = [
  ...POST_EVENTS,
  ...NOTIFICATION_EVENTS,
  ...MESSAGE_EVENTS,
  ...USER_EVENTS,
  ...FRIEND_EVENTS,
  ...TYPING_EVENTS,
  ...ROOM_EVENTS,
  ...SYSTEM_EVENTS,
];

/**
 * Obtener eventos por categoría
 */
export const getEventsByCategory = (category: SocketEvent['category']): SocketEvent[] => {
  return ALL_SOCKET_EVENTS.filter(event => event.category === category);
};

/**
 * Obtener evento por nombre
 */
export const getEventByName = (name: string): SocketEvent | undefined => {
  return ALL_SOCKET_EVENTS.find(event => event.name === name);
};

/**
 * Categorías disponibles
 */
export const EVENT_CATEGORIES = [
  { id: 'posts', label: 'Posts', icon: '', color: 'green' },
  { id: 'notifications', label: 'Notificaciones', icon: '', color: 'blue' },
  { id: 'messages', label: 'Mensajes', icon: '', color: 'purple' },
  { id: 'users', label: 'Usuarios', icon: '', color: 'cyan' },
  { id: 'friends', label: 'Amigos', icon: '', color: 'indigo' },
  { id: 'typing', label: 'Escribiendo', icon: '', color: 'blue' },
  { id: 'rooms', label: 'Salas', icon: '', color: 'orange' },
] as const;
