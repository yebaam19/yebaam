import { useEffect } from 'react';
import { useChatSocket } from './useChatSocket';
import { useChatStore } from '../store/chat.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { MessageMedia } from '../types';


export function useChat() {
  const user = useAuthStore((state) => state.user);
  const {
    conversations,
    activeConversationId,
    isLoadingConversations,
    loadConversations,
    setActiveConversation,
    updateConversation,
    getTotalUnreadCount,
    resetUnreadCount,
    incrementUnreadCount,
  } = useChatStore();

  const totalUnreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  const {
    chatSocket,
    joinConversation,
    leaveConversation,
    sendMessage: sendMessageSocket,
    markAsRead,
    isConnected,
  } = useChatSocket({
    // Cuando llega un mensaje, SOLO actualizar metadata en Zustand
    onMessageReceived: (event) => {
      const { message, conversationId } = event;

      console.log('📨 [useChat] Mensaje recibido:', {
        messageId: message.id,
        senderId: message.senderId,
        myId: user?.id,
        isMyMessage: message.senderId === user?.id,
      });

      // Buscar conversación
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
  
        const isMyMessage = message.senderId === user?.id;
        const shouldIncrementUnread = !isMyMessage && conversation.id !== activeConversationId;
        
        console.log(`unreadCount: ${conversation.unreadCount} → ${shouldIncrementUnread ? conversation.unreadCount + 1 : conversation.unreadCount}`);

        // Actualizar lastMessage y unreadCount en Zustand
        updateConversation({
          ...conversation,
          lastMessage: {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            createdAt: message.createdAt,
          },
          updatedAt: message.createdAt,
          unreadCount: shouldIncrementUnread
            ? conversation.unreadCount + 1 
            : conversation.unreadCount,
        });
      } else {
        // Conversación nueva, recargar lista
        console.log('[useChat] Conversación nueva detectada, recargando...');
        loadConversations();
      }
    },
    
    // Cuando se leen mensajes, resetear contador
    onMessagesRead: (event) => {
      console.log(' Mensajes marcados como leídos:', event.conversationId);
      resetUnreadCount(event.conversationId);
    },
  });
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);
  const sendMessage = async (
    conversationId: string,
    content?: string,
    media?: MessageMedia
  ) => {
    // Validar que haya al menos contenido o media
    if (!content?.trim() && !media) {
      throw new Error('El mensaje debe tener contenido o media');
    }

    try {
      
      // Enviar por WebSocket
      const message = await sendMessageSocket({
        conversationId,
        content: content || undefined,
        media,
      });

      
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation && message) {
        updateConversation({
          ...conversation,
          lastMessage: {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            createdAt: message.createdAt,
          },
          updatedAt: message.createdAt,
        });
      }
      
      return message;
    } catch (error) {
      console.error(' Error sending message:', error);
      throw error;
    }
  };

  const openConversation = async (conversationId: string) => {
    try {

      setActiveConversation(conversationId);
      await joinConversation(conversationId);
      try {
        await markAsRead(conversationId);
        resetUnreadCount(conversationId);
      } catch (error) {
        console.error('Error marking as read:', error);
      }
      
      console.log(' Conversación abierta');
    } catch (error) {
      console.error(' Error opening conversation:', error);
      throw error;
    }
  };

  const closeConversation = async (conversationId: string) => {
    try {
      
      await leaveConversation(conversationId);
      
      if (activeConversationId === conversationId) {
        setActiveConversation(null);
      }
    } catch (error) {
      console.error('Error closing conversation:', error);
    }
  };

  return {

    conversations,
    activeConversationId,
    isLoadingConversations,
    isConnected,
    totalUnreadCount, 
    openConversation,
    closeConversation,
    sendMessage,
    loadConversations,
    chatSocket,
  };
}
