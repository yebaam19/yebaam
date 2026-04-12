'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { socketManager } from '@/socket/socket-client';

/**
 * Socket Namespace Configuration
 */
interface SocketNamespace {
  name: string;
  path: string;
  onConnect?: (socket: Socket, userId: string) => void;
  onDisconnect?: (socket: Socket) => void;
}

const SOCKET_NAMESPACES: SocketNamespace[] = [
  { name: 'users', path: '/users' },
  { name: 'posts', path: '/posts' },
  { name: 'stories', path: '/stories' },
  { name: 'friendships', path: '/friendships' },
  { name: 'notifications', path: '/notifications' },
  {
    name: 'chat',
    path: '/chat',
    onConnect: (socket, userId) => {
      socket.emit('join_chat', { userId });
    },
  },
];

/**
 * Socket Context Types
 */
interface SocketContextType {
  getSocket: (namespace: string) => Socket | null;
  isConnected: (namespace?: string) => boolean;
  connectionState: 'connected' | 'disconnected' | 'reconnecting';
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  getSocket: () => null,
  isConnected: () => false,
  connectionState: 'disconnected',
  reconnect: () => {},
});

/**
 * Socket Provider - Versión mejorada
 * 
 * Mejoras:
 * - Gestión centralizada de sockets
 * - Configuración basada en array
 * - Sin estados individuales por socket
 * - Fácil de escalar agregando a SOCKET_NAMESPACES
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const [sockets, setSockets] = useState<Map<string, Socket>>(new Map());
  const [connectionStates, setConnectionStates] = useState<Map<string, boolean>>(new Map());
  const [connectionState, setConnectionState] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  /**
   * Get a socket by namespace
   */
  const getSocket = useCallback((namespace: string): Socket | null => {
    const normalizedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    return sockets.get(normalizedNamespace) || null;
  }, [sockets]);

  /**
   * Check if a socket (or all sockets) is connected
   */
  const isConnected = useCallback((namespace?: string): boolean => {
    if (namespace) {
      const normalizedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
      return connectionStates.get(normalizedNamespace) || false;
    }
    // Check if any socket is connected
    return Array.from(connectionStates.values()).some(state => state);
  }, [connectionStates]);

  /**
   * Reconnect all sockets
   */
  const reconnect = useCallback(() => {
    setConnectionState('reconnecting');
    sockets.forEach((socket) => {
      if (!socket.connected) {
        socket.connect();
      }
    });
  }, [sockets]);

  /**
   * Initialize sockets when user is authenticated
   */
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Cleanup on logout
      socketManager.disconnectAll();
      setSockets(new Map());
      setConnectionStates(new Map());
      setConnectionState('disconnected');
      return;
    }

    const newSockets = new Map<string, Socket>();
    const newConnectionStates = new Map<string, boolean>();

    // Initialize all sockets from configuration
    SOCKET_NAMESPACES.forEach(({ name, path, onConnect, onDisconnect }) => {
      const socket = socketManager.getSocket(path);
      newSockets.set(path, socket);
      newConnectionStates.set(path, socket.connected);

      // Setup connection listeners
      const handleConnect = () => {
        setConnectionStates(prev => new Map(prev).set(path, true));
        onConnect?.(socket, user.id);
      };

      const handleDisconnect = () => {
        setConnectionStates(prev => new Map(prev).set(path, false));
        onDisconnect?.(socket);
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      // Check initial state
      if (socket.connected) {
        handleConnect();
      }

      // Store cleanup handlers
      (socket as any)._providerHandlers = { handleConnect, handleDisconnect };
    });

    setSockets(newSockets);
    setConnectionStates(newConnectionStates);

    // Heartbeat for main socket
    const mainSocket = newSockets.get('/users');
    const heartbeatInterval = setInterval(() => {
      if (mainSocket?.connected) {
        mainSocket.emit('heartbeat');
      }
    }, 30000);

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
      
      newSockets.forEach((socket) => {
        const handlers = (socket as any)._providerHandlers;
        if (handlers) {
          socket.off('connect', handlers.handleConnect);
          socket.off('disconnect', handlers.handleDisconnect);
          delete (socket as any)._providerHandlers;
        }
      });

      socketManager.disconnectAll();
    };
  }, [isAuthenticated, user]);

  /**
   * Update global connection state
   */
  useEffect(() => {
    const anyConnected = Array.from(connectionStates.values()).some(state => state);
    
    if (anyConnected) {
      setConnectionState('connected');
    } else if (connectionState === 'reconnecting') {
      // Maintain reconnecting state
    } else {
      setConnectionState('disconnected');
    }
  }, [connectionStates, connectionState]);

  return (
    <SocketContext.Provider 
      value={{ 
        getSocket,
        isConnected,
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

/**
 * Hook conveniente para obtener sockets específicos
 */
export function useNamespaceSocket(namespace: string) {
  const { getSocket, isConnected } = useSocket();
  
  return {
    socket: getSocket(namespace),
    isConnected: isConnected(namespace),
  };
}
