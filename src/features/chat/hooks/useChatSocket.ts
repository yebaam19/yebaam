import { useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { socketManager } from '@/socket/socket-client';
import {
  Message,
  CreateMessageDto,
  MessageReceivedEvent,
  MessagesReadEvent,
  SendMessageResponse,
  JoinConversationResponse,
} from '../types';

interface UseChatSocketProps {
  onMessageReceived?: (event: MessageReceivedEvent) => void;
  onMessagesRead?: (event: MessagesReadEvent) => void;
  onError?: (error: string) => void;
}

interface UseChatSocketReturn {
  chatSocket: Socket | null;
  joinConversation: (conversationId: string) => Promise<void>;
  leaveConversation: (conversationId: string) => Promise<void>;
  sendMessage: (messageData: CreateMessageDto) => Promise<Message | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  isConnected: boolean;
}

export function useChatSocket({
  onMessageReceived,
  onMessagesRead,
  onError,
}: UseChatSocketProps = {}): UseChatSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    // Obtener el socket del namespace /chat
    const socket = socketManager.getSocket('/chat');
    socketRef.current = socket;

    // Event listeners
    const handleConnect = () => {
      console.log(' Conectado al chat WebSocket');
      isConnectedRef.current = true;
    };

    const handleDisconnect = () => {
      console.log(' Desconectado del chat WebSocket');
      isConnectedRef.current = false;
    };

    const handleMessageReceived = (data: MessageReceivedEvent) => {
      console.log('📨 Mensaje recibido:', data);
      onMessageReceived?.(data);
    };

    const handleMessagesRead = (data: MessagesReadEvent) => {
      console.log(' Mensajes marcados como leídos:', data);
      onMessagesRead?.(data);
    };

    const handleError = (error: any) => {
      console.error(' Error en chat socket:', error);
      onError?.(error.message || 'Error desconocido');
    };

    // Registrar event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('message_received', handleMessageReceived);
    socket.on('messages_read', handleMessagesRead);
    socket.on('error', handleError);

    // Verificar si ya está conectado
    if (socket.connected) {
      isConnectedRef.current = true;
    }

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('message_received', handleMessageReceived);
      socket.off('messages_read', handleMessagesRead);
      socket.off('error', handleError);
    };
  }, [onMessageReceived, onMessagesRead, onError]);

  /**
   * Unirse a una sala de conversación
   */
  const joinConversation = useCallback(
    async (conversationId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current) {
          reject(new Error('Socket no disponible'));
          return;
        }

        socketRef.current.emit(
          'join_conversation',
          { conversationId },
          (response: JoinConversationResponse) => {
            if (response.success) {
              console.log(
                `🚪 Te uniste a la conversación ${conversationId}`,
              );
              resolve();
            } else {
              console.error('Error al unirse a la conversación:', response.error);
              reject(new Error(response.error || 'Error desconocido'));
            }
          },
        );
      });
    },
    [],
  );

  /**
   * Salir de una sala de conversación
   */
  const leaveConversation = useCallback(
    async (conversationId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current) {
          reject(new Error('Socket no disponible'));
          return;
        }

        socketRef.current.emit(
          'leave_conversation',
          { conversationId },
          (response: JoinConversationResponse) => {
            if (response.success) {
              console.log(
                `🚪 Saliste de la conversación ${conversationId}`,
              );
              resolve();
            } else {
              console.error('Error al salir de la conversación:', response.error);
              reject(new Error(response.error || 'Error desconocido'));
            }
          },
        );
      });
    },
    [],
  );

  /**
   * Enviar un mensaje
   */
  const sendMessage = useCallback(
    async (messageData: CreateMessageDto): Promise<Message | null> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current) {
          reject(new Error('Socket no disponible'));
          return;
        }

        socketRef.current.emit(
          'send_message',
          messageData,
          (response: SendMessageResponse) => {
            if (response.success && response.message) {
              console.log(' Mensaje enviado exitosamente:', response.message);
              resolve(response.message);
            } else {
              console.error('Error al enviar mensaje:', response.error);
              reject(new Error(response.error || 'Error al enviar mensaje'));
            }
          },
        );
      });
    },
    [],
  );

  /**
   * Marcar mensajes como leídos
   */
  const markAsRead = useCallback(
    async (conversationId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current) {
          reject(new Error('Socket no disponible'));
          return;
        }

        socketRef.current.emit(
          'mark_as_read',
          { conversationId },
          (response: { success: boolean; error?: string }) => {
            if (response.success) {
              console.log(` Mensajes marcados como leídos en ${conversationId}`);
              resolve();
            } else {
              console.error('Error al marcar como leído:', response.error);
              reject(new Error(response.error || 'Error desconocido'));
            }
          },
        );
      });
    },
    [],
  );

  return {
    chatSocket: socketRef.current,
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
    isConnected: isConnectedRef.current,
  };
}
