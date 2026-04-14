'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  socketManager,
  getUsersSocket,
  getPostsSocket,
  getStoriesSocket,
  getFriendshipsSocket,
  getNotificationsSocket,
} from '@/socket/socket-client';
import { isRealtimeEnabled } from '@/socket/realtime-flag';

/**
 * Socket Connection State
 */
type ConnectionState = 'connected' | 'disconnected' | 'reconnecting' | 'error';

/**
 * Socket Context Types
 */
interface SocketContextType {
  usersSocket: Socket | null;
  postsSocket: Socket | null;
  storiesSocket: Socket | null;
  friendshipsSocket: Socket | null;
  notificationsSocket: Socket | null;
  chatSocket: Socket | null;
  isConnected: boolean;
  isUsersConnected: boolean;
  isPostsConnected: boolean;
  isStoriesConnected: boolean;
  isFriendshipsConnected: boolean;
  isNotificationsConnected: boolean;
  isChatConnected: boolean;
  connectionState: ConnectionState;
  reconnect: () => void;
}

// Crear Context
const SocketContext = createContext<SocketContextType>({
  usersSocket: null,
  postsSocket: null,
  storiesSocket: null,
  friendshipsSocket: null,
  notificationsSocket: null,
  chatSocket: null,
  isConnected: false,
  isUsersConnected: false,
  isPostsConnected: false,
  isStoriesConnected: false,
  isFriendshipsConnected: false,
  isNotificationsConnected: false,
  isChatConnected: false,
  connectionState: 'disconnected',
  reconnect: () => {},
});

/**
 * Socket Provider
 * Provee sockets centralizados a toda la aplicación usando un Manager único
 * Solo inicializa los sockets cuando el usuario está autenticado
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();

  const [usersSocket, setUsersSocket] = useState<Socket | null>(null);
  const [postsSocket, setPostsSocket] = useState<Socket | null>(null);
  const [storiesSocket, setStoriesSocket] = useState<Socket | null>(null);
  const [friendshipsSocket, setFriendshipsSocket] = useState<Socket | null>(null);
  const [notificationsSocket, setNotificationsSocket] = useState<Socket | null>(null);
  const [chatSocket, setChatSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isUsersConnected, setIsUsersConnected] = useState(false);
  const [isPostsConnected, setIsPostsConnected] = useState(false);
  const [isStoriesConnected, setIsStoriesConnected] = useState(false);
  const [isFriendshipsConnected, setIsFriendshipsConnected] = useState(false);
  const [isNotificationsConnected, setIsNotificationsConnected] = useState(false);
  const [isChatConnected, setIsChatConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  
  // Ref para evitar múltiples inicializaciones
  const isInitialized = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Función para reconectar manualmente todos los sockets
   */
  const reconnect = useCallback(() => {
    setConnectionState('reconnecting');
    
    // Reconectar cada socket si no está conectado
    if (usersSocket && !usersSocket.connected) usersSocket.connect();
    if (postsSocket && !postsSocket.connected) postsSocket.connect();
    if (storiesSocket && !storiesSocket.connected) storiesSocket.connect();
    if (friendshipsSocket && !friendshipsSocket.connected) friendshipsSocket.connect();
    if (notificationsSocket && !notificationsSocket.connected) notificationsSocket.connect();
    if (chatSocket && !chatSocket.connected) chatSocket.connect();
  }, [usersSocket, postsSocket, storiesSocket, friendshipsSocket, notificationsSocket, chatSocket]);

  /**
   * Actualizar estado global de conexión basado en estados individuales
   */
  useEffect(() => {
    const anyConnected = isUsersConnected || isPostsConnected || isStoriesConnected || 
                        isFriendshipsConnected || isNotificationsConnected || isChatConnected;
    
    if (anyConnected) {
      setConnectionState('connected');
      setIsConnected(true);
    } else if (connectionState === 'reconnecting') {
      // Mantener estado de reconexión
    } else {
      setConnectionState('disconnected');
      setIsConnected(false);
    }
  }, [isUsersConnected, isPostsConnected, isStoriesConnected, isFriendshipsConnected, isNotificationsConnected, isChatConnected, connectionState]);

  useEffect(() => {
    if (!isAuthenticated || !user) {

      return;
    }

    if (!isRealtimeEnabled()) {
      // Legacy socket.io backend is gone. Stay dormant until the Supabase
      // Realtime migration replaces this provider.
      return;
    }

    // Inicializar todos los sockets
    const users = getUsersSocket();
    const posts = getPostsSocket(); 
    const stories = getStoriesSocket();
    const friendships = getFriendshipsSocket();
    const notifications = getNotificationsSocket();
    const chat = socketManager.getSocket('/chat');


    setUsersSocket(users);
    setPostsSocket(posts);
    setStoriesSocket(stories);
    setFriendshipsSocket(friendships);
    setNotificationsSocket(notifications);
    setChatSocket(chat);

    // Configuración de sockets con sus handlers
    const socketConfigs = [
      {
        socket: users,
        name: 'users',
        setConnected: setIsUsersConnected,
        onConnect: () => setIsConnected(true),
        onDisconnect: () => setIsConnected(false),
      },
      {
        socket: posts,
        name: 'posts',
        setConnected: setIsPostsConnected,
      },
      {
        socket: stories,
        name: 'stories',
        setConnected: setIsStoriesConnected,
      },
      {
        socket: friendships,
        name: 'friendships',
        setConnected: setIsFriendshipsConnected,
      },
      {
        socket: notifications,
        name: 'notifications',
        setConnected: setIsNotificationsConnected,
        onConnect: () => {
          // CRÍTICO: Unirse a la room personal del usuario
          if (user?.id) {
            notifications.emit('join_notification_room', { userId: user.id }, (response: any) => {
              if (response?.success) {
              
              } else {
                console.error('[SocketProvider]  Error al unirse a la room de notificaciones:', response);
              }
            });
          }
        },
      },
      {
        socket: chat,
        name: 'chat',
        setConnected: setIsChatConnected,
        onConnect: () => {
        
          if (user?.id) {
            chat.emit('join_chat', { userId: user.id });
          }
        },
        onDisconnect: () => {
      
        },
      },
    ];

    // Registrar listeners para cada socket
    socketConfigs.forEach(({ socket, name, setConnected, onConnect, onDisconnect }) => {
      const handleConnect = () => {
        
        setConnected(true);
        onConnect?.();
      };

      const handleDisconnect = (reason: string) => {
      
        setConnected(false);
        onDisconnect?.();
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      // Verificar estado inicial
      if (socket.connected) {
        handleConnect();
      }

      // Guardar handlers para cleanup
      (socket as any)._customHandlers = { handleConnect, handleDisconnect };
    });

    // Heartbeat para mantener conexión activa
    const heartbeatInterval = setInterval(() => {
      if (users.connected) {
        users.emit('heartbeat');
      }
    }, 30000); // 30 segundos

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
      
      // Remover listeners de cada socket
      socketConfigs.forEach(({ socket }) => {
        const handlers = (socket as any)._customHandlers;
        if (handlers) {
          socket.off('connect', handlers.handleConnect);
          socket.off('disconnect', handlers.handleDisconnect);
          delete (socket as any)._customHandlers;
        }
      });
      socketManager.disconnectAll();
    };

  }, [isAuthenticated, user]); 

  return (
    <SocketContext.Provider 
      value={{ 
        usersSocket, 
        postsSocket,
        storiesSocket,
        friendshipsSocket,
        notificationsSocket,
        chatSocket,
        isConnected,
        isUsersConnected,
        isPostsConnected,
        isStoriesConnected,
        isFriendshipsConnected,
        isNotificationsConnected,
        isChatConnected,
        connectionState,
        reconnect,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Hook para usar el Socket Context
 */
export function useSocket() {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
}
