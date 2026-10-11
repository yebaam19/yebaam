import type { SocketEvent } from './socket-event-types';

export const USER_EVENTS: SocketEvent[] = [
  {
    name: 'user_profile_updated',
    category: 'users',
    description: 'Usuario actualizó su perfil',
    icon: '',
    color: 'blue',
    isIncoming: true,
  },
  {
    name: 'user_avatar_updated',
    category: 'users',
    description: 'Usuario cambió su avatar',
    icon: '',
    color: 'cyan',
    isIncoming: true,
  },
  {
    name: 'user_banner_updated',
    category: 'users',
    description: 'Usuario cambió su banner',
    icon: '',
    color: 'purple',
    isIncoming: true,
  },
  {
    name: 'user_status_changed',
    category: 'users',
    description: 'Usuario cambió su estado (online/offline/away)',
    icon: '',
    color: 'green',
    isIncoming: true,
  },
  {
    name: 'user:online',
    category: 'users',
    description: 'Usuario se conectó',
    icon: '',
    color: 'green',
    isIncoming: true,
  },
  {
    name: 'user:offline',
    category: 'users',
    description: 'Usuario se desconectó',
    icon: '',
    color: 'neutral',
    isIncoming: true,
  },
];

/**
 * Eventos de AMIGOS
 */
export const FRIEND_EVENTS: SocketEvent[] = [
  {
    name: 'friend_request_received',
    category: 'friends',
    description: 'Nueva solicitud de amistad recibida',
    icon: '',
    color: 'indigo',
    isIncoming: true,
  },
  {
    name: 'friend_request_accepted',
    category: 'friends',
    description: 'Solicitud de amistad aceptada',
    icon: '',
    color: 'green',
    isIncoming: true,
  },
  {
    name: 'friend_online',
    category: 'friends',
    description: 'Amigo se conectó',
    icon: '',
    color: 'green',
    isIncoming: true,
  },
  {
    name: 'friend_offline',
    category: 'friends',
    description: 'Amigo se desconectó',
    icon: '',
    color: 'neutral',
    isIncoming: true,
  },
  {
    name: 'friend_removed',
    category: 'friends',
    description: 'Te eliminaron de amigos',
    icon: '',
    color: 'red',
    isIncoming: true,
  },
  {
    name: 'friend:request',
    category: 'friends',
    description: 'Solicitud de amistad enviada',
    icon: '',
    color: 'blue',
    isIncoming: true,
  },
  {
    name: 'friend:accepted',
    category: 'friends',
    description: 'Amistad confirmada',
    icon: '',
    color: 'green',
    isIncoming: true,
  },
];

/**
 * Eventos de TYPING (Escribiendo)
 */
