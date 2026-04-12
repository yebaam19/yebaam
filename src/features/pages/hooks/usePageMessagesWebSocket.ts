import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUpdateConversationOnNewMessage } from './usePageMessages';
import type { PageMessage } from '../interfaces/page-message.interface';

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface UsePageMessagesWebSocketOptions {
  pageId?: string;
  conversationId?: string;
  onNewMessage?: (message: PageMessage) => void;
  onMessagesRead?: (data: { conversationId: string; readByUserId: string }) => void;
  onTyping?: (data: { userId: string; userName: string; isTyping: boolean }) => void;
}

/**
 * Hook para manejar conexión WebSocket de mensajes de páginas
 * Maneja eventos en tiempo real: nuevos mensajes, lectura, typing indicators
 */
export function usePageMessagesWebSocket(options: UsePageMessagesWebSocketOptions = {}) {
  const { pageId, conversationId, onNewMessage, onMessagesRead, onTyping } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const updateConversation = useUpdateConversationOnNewMessage();

  useEffect(() => {
    // Obtener token del localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, WebSocket will not connect');
      return;
    }

    // Conectar al namespace de mensajes
    const socket = io(`${WEBSOCKET_URL}/pages/messages`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Event handlers
    socket.on('connect', () => {
      console.log(' Connected to page messages WebSocket');
      setIsConnected(true);

      // Si hay conversationId, suscribirse
      if (conversationId) {
        socket.emit('conversation:subscribe', { conversationId });
      }

      // Si hay pageId, suscribirse al inbox de la página
      if (pageId) {
        socket.emit('page:inbox:subscribe', { pageId });
      }
    });

    socket.on('disconnect', () => {
      console.log(' Disconnected from page messages WebSocket');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Nuevo mensaje
    socket.on('message:new', (data: { conversationId: string; message: PageMessage; timestamp: Date }) => {
      console.log('📨 New message received:', data);
      
      if (onNewMessage) {
        onNewMessage(data.message);
      }

      // Actualizar cache de React Query
      if (pageId) {
        updateConversation(pageId, data.conversationId, data.message);
      }
    });

    // Mensajes leídos
    socket.on('messages:read', (data: { conversationId: string; readByUserId: string; readCount: number; timestamp: Date }) => {
      console.log(' Messages read:', data);
      
      if (onMessagesRead) {
        onMessagesRead(data);
      }
    });

    // Usuario escribiendo
    socket.on('message:typing', (data: { conversationId: string; userId: string; userName: string; isTyping: boolean; timestamp: Date }) => {
      console.log('✍️ User typing:', data);
      
      if (onTyping && data.conversationId === conversationId) {
        onTyping(data);
      }
    });

    // Notificación de inbox
    socket.on('inbox:new-message', (data: { conversationId: string; message: PageMessage; type: string; timestamp: Date }) => {
      console.log('📬 Inbox notification:', data);
      
      if (onNewMessage) {
        onNewMessage(data.message);
      }
    });

    // Contador de no leídos actualizado
    socket.on('inbox:unread-count', (data: { pageId?: string; userId?: string; unreadCount: number; timestamp: Date }) => {
      console.log('🔔 Unread count updated:', data);
      // Aquí podrías actualizar un badge de notificaciones
    });

    // Cleanup
    return () => {
      if (conversationId) {
        socket.emit('conversation:unsubscribe', { conversationId });
      }
      if (pageId) {
        socket.emit('page:inbox:unsubscribe', { pageId });
      }
      socket.disconnect();
    };
  }, [pageId, conversationId, onNewMessage, onMessagesRead, onTyping, updateConversation]);

  /**
   * Suscribirse a una conversación
   */
  const subscribeToConversation = (convId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('conversation:subscribe', { conversationId: convId });
    }
  };

  /**
   * Desuscribirse de una conversación
   */
  const unsubscribeFromConversation = (convId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('conversation:unsubscribe', { conversationId: convId });
    }
  };

  /**
   * Emitir evento de typing
   */
  const emitTyping = (convId: string, userName: string, isTyping: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message:typing', {
        conversationId: convId,
        userName,
        isTyping,
      });
    }
  };

  return {
    isConnected,
    socket: socketRef.current,
    subscribeToConversation,
    unsubscribeFromConversation,
    emitTyping,
  };
}
