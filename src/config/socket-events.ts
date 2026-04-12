/**
 * Configuración de Eventos de WebSocket
 * 
 * Define todos los eventos que el cliente puede escuchar y emitir
 */

export interface SocketEvent {
  name: string;
  category: 'posts' | 'notifications' | 'messages' | 'users' | 'friends' | 'typing' | 'rooms';
  description: string;
  icon: string;
  color: string;
  isIncoming?: boolean; // true = solo escucha, false = solo emite
  payload?: Record<string, any>;
}

/**
 * Eventos de POSTS
 * IMPORTANTE: Los nombres deben coincidir EXACTAMENTE con el backend (con guión bajo _)
 */
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

/**
 * Payloads de ejemplo para testing
 */
export const SAMPLE_PAYLOADS: Record<string, any> = {
  'post_created': {
    _id: 'post-123',
    content: 'Post de prueba desde WebSocket',
    authorId: 'user-1',
    authorUsername: 'TestUser',
    authorFirstName: 'Test',
    authorLastName: 'User',
    authorAvatar: 'https://example.com/avatar.jpg',
    backgroundColor: '#ffffff',
    privacy: 'public',
    mediaFiles: [],
    reactionsCount: {
      like: 0,
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0,
    },
    commentsCount: 0,
    sharesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'post_updated': {
    postId: 'post-123',
    content: 'Post actualizado desde WebSocket',
    backgroundColor: '#f0f0f0',
    privacy: 'friends',
  },
  'post_deleted': 'post-123',
  'post_add_reaction': {
    post: {
      _id: 'post-123',
      reactionsCount: {
        like: 5,
        love: 2,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0,
      },
    },
    reactions: [
      {
        userId: 'user-2',
        type: 'like',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  'post_remove_reaction': {
    post: {
      _id: 'post-123',
      reactionsCount: {
        like: 4,
        love: 2,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0,
      },
    },
    reactions: [],
  },
  'post_upload_media': {
    postId: 'post-123',
    mediaFiles: [
      {
        id: 'media-1',
        url: 'https://example.com/image.jpg',
        type: 'image',
        s3Key: 'posts/123/media-1.jpg',
        cloudFrontUrl: 'https://cdn.example.com/image.jpg',
      },
    ],
  },
  'post_replace_media': {
    postId: 'post-123',
    mediaFiles: [
      {
        id: 'media-2',
        url: 'https://example.com/new-image.jpg',
        type: 'image',
        s3Key: 'posts/123/media-2.jpg',
        cloudFrontUrl: 'https://cdn.example.com/new-image.jpg',
      },
    ],
  },
  'post_remove_media': {
    postId: 'post-123',
    mediaId: 'media-1',
  },
  'user_profile_updated': {
    userId: 'user-1',
    username: 'TestUser',
    updates: {
      bio: 'Nueva biografía',
      location: 'Ciudad de México',
    },
  },
  'user_avatar_updated': {
    userId: 'user-1',
    username: 'TestUser',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  'user_status_changed': {
    userId: 'user-1',
    username: 'TestUser',
    status: 'online', // online | offline | away
    lastSeen: new Date().toISOString(),
  },
  'friend_request_received': {
    requestId: 'req-123',
    from: {
      id: 'user-2',
      username: 'JohnDoe',
      avatar: 'https://example.com/john.jpg',
    },
    timestamp: new Date().toISOString(),
  },
  'friend_online': {
    friendId: 'user-2',
    username: 'JohnDoe',
    status: 'online',
  },
  'user_typing': {
    userId: 'user-2',
    username: 'JohnDoe',
    chatId: 'chat-123',
  },
  'message:new': {
    messageId: 'msg-123',
    chatId: 'chat-123',
    from: {
      id: 'user-2',
      username: 'JohnDoe',
    },
    content: 'Hola! ¿Cómo estás?',
    timestamp: new Date().toISOString(),
  },
};
