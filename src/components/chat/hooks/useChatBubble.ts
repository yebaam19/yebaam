import { useState, useEffect, useRef } from 'react';
import { useChat, chatService } from '@/features/chat';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useSocket } from '@/providers/socket-provider';
import type { MessageMedia } from '@/features/chat/types';

interface UseChatBubbleProps {
  contactId: string;
}

export function useChatBubble({ contactId }: UseChatBubbleProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);

  const user = useAuthStore((state) => state.user);
  const { chatSocket } = useSocket();

  const {
    sendMessage: sendMessageSocket,
    openConversation,
    closeConversation,
    isConnected,
  } = useChat();

  // Obtener o crear conversación al montar
  useEffect(() => {
    const initializeConversation = async () => {
      try {
        setIsLoadingConversation(true);
        
        // Intentar encontrar conversación existente
        let conversation = await chatService.findConversationByParticipant(contactId);
        
        // Si no existe, crear una nueva
        if (!conversation) {
          conversation = await chatService.createOrGetConversation(contactId);
        }
        
        setConversationId(conversation.id);
        
        // Cargar mensajes
        const result = await chatService.getConversationMessages(conversation.id, 50, 0);
        console.log(' [useChatBubble] Mensajes recibidos:', result.messages.map((m: any) => ({ id: m.id?.slice(0, 8), media: m.media })));
        const sortedMessages = result.messages.sort((a: any, b: any) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        setMessages(sortedMessages);
        
        // Abrir la conversación (se une al WebSocket)
        await openConversation(conversation.id);
      } catch (error) {
        console.error('Error initializing conversation:', error);
      } finally {
        setIsLoadingConversation(false);
      }
    };

    initializeConversation();

    // Cleanup: cerrar conversación al desmontar
    return () => {
      if (conversationId) {
        closeConversation(conversationId);
      }
    };
  }, [contactId]); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket listeners para nuevos mensajes
  useEffect(() => {
    if (!chatSocket || !conversationId) return;

    const handleMessageReceived = (event: any) => {
      if (event.conversationId === conversationId) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === event.message.id);
          if (exists) return prev;

          const newMessages = [...prev, event.message];
          return newMessages.sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });

        // Auto-marcar como leído
        if (event.message.senderId !== user?.id) {
          chatSocket.emit('mark_as_read', { conversationId });
        }
      }
    };

    const handleMessagesRead = (event: any) => {
      if (event.conversationId === conversationId && event.userId !== user?.id) {
        setMessages(prev =>
          prev.map(msg => {
            if (msg.senderId === user?.id && msg.status !== 'read') {
              return { ...msg, status: 'read' };
            }
            return msg;
          })
        );
      }
    };

    chatSocket.on('message_received', handleMessageReceived);
    chatSocket.on('messages_read', handleMessagesRead);

    return () => {
      chatSocket.off('message_received', handleMessageReceived);
      chatSocket.off('messages_read', handleMessagesRead);
    };
  }, [chatSocket, conversationId, user?.id]);

  // Función para enviar mensaje
  const sendMessage = async (
    content?: string,
    media?: MessageMedia
  ): Promise<boolean> => {
    // Validar que haya al menos contenido o media
    if (!content?.trim() && !media) {
      return false;
    }

    // Si no hay conversationId aún, esperar a que se cree (máx 5 segundos)
    if (!conversationId) {
      console.log(' [useChatBubble] Esperando a que se cree la conversación...');
      
      // Esperar hasta 5 segundos a que conversationId esté disponible
      const maxWaitTime = 5000;
      const startTime = Date.now();
      
      while (!conversationId && (Date.now() - startTime) < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!conversationId) {
        console.error(' [useChatBubble] Timeout esperando conversationId');
        return false;
      }
      
      console.log(' [useChatBubble] ConversationId disponible:', conversationId);
    }

    try {
      const message = await sendMessageSocket(conversationId, content, media);
      
      // Agregar mensaje optimista si no llega por WebSocket
      if (message) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;

          const newMessages = [...prev, message];
          return newMessages.sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  // Función para cerrar conversación
  const handleCloseConversation = () => {
    if (conversationId) {
      closeConversation(conversationId);
    }
  };

  return {
    conversationId,
    messages,
    isLoadingConversation,
    isConnected,
    sendMessage,
    closeConversation: handleCloseConversation,
  };
}
