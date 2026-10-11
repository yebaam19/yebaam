import type { SocketEvent } from './socket-event-types';

export const TYPING_EVENTS: SocketEvent[] = [
  {
    name: 'user_typing',
    category: 'typing',
    description: 'Usuario está escribiendo',
    icon: '',
    color: 'blue',
    isIncoming: true,
  },
  {
    name: 'typing_start',
    category: 'typing',
    description: 'Usuario empezó a escribir',
    icon: '',
    color: 'blue',
    isIncoming: false,
  },
  {
    name: 'typing_stop',
    category: 'typing',
    description: 'Usuario dejó de escribir',
    icon: '',
    color: 'neutral',
    isIncoming: false,
  },
];

/**
 * Eventos de SALAS (Rooms)
 */
export const ROOM_EVENTS: SocketEvent[] = [
  {
    name: 'join_user_room',
    category: 'rooms',
    description: 'Cliente se une a su sala personal',
    icon: '',
    color: 'green',
    isIncoming: false,
  },
  {
    name: 'leave_user_room',
    category: 'rooms',
    description: 'Cliente sale de su sala personal',
    icon: '',
    color: 'red',
    isIncoming: false,
  },
  {
    name: 'update_status',
    category: 'rooms',
    description: 'Actualizar estado del usuario',
    icon: '',
    color: 'blue',
    isIncoming: false,
  },
];

/**
 * Eventos GENERALES del sistema
 */
export const SYSTEM_EVENTS: SocketEvent[] = [
  {
    name: 'users:count',
    category: 'users',
    description: 'Conteo de usuarios conectados',
    icon: '',
    color: 'blue',
    isIncoming: true,
  },
  {
    name: 'config:updated',
    category: 'users',
    description: 'Configuración del usuario actualizada',
    icon: '',
    color: 'neutral',
    isIncoming: true,
  },
];

