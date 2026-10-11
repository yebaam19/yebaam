export interface SocketEvent {
  name: string;
  category: 'posts' | 'notifications' | 'messages' | 'users' | 'friends' | 'typing' | 'rooms';
  description: string;
  icon: string;
  color: string;
  isIncoming?: boolean; // true = solo escucha, false = solo emite
  payload?: Record<string, unknown>;
}

