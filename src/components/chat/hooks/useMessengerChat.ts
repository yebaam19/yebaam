import { useMessengerSubscriptions } from './useMessengerSubscriptions';
import { useState, useRef, useEffect } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChatNotifications } from '@/features/chat/context/chat-notification.context';
import { chatService } from '@/features/chat/services/chat.service';
import type { MessageMedia, ChatMessage, Conversation } from '@/features/chat/types';

interface UseMessengerChatProps {
  contactId: string;
  activeChat: { id: string } | null;
}

export function useMessengerChat({ contactId, activeChat }: UseMessengerChatProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const user = useAuthStore((state) => state.user);

  const { markConversationAsOpen, markConversationAsClosed } = useChatNotifications();
  const { chatSocket, usersSocket } = useSocket();


  useEffect(() => {
    if (!activeChat || !contactId) {
      console.log(' [useMessengerChat] No hay chat activo, saltando inicialización');
      return;
    }

    const initializeConversation = async () => {
      try {

        setIsLoading(true);

        let conversation = await chatService.findConversationByParticipant(contactId);

        if (!conversation) {
        
          conversation = await chatService.createOrGetConversation(contactId);
        }

        // Guardar conversación completa y su ID
        setConversation(conversation);
        setConversationId(conversation.id);
        markConversationAsOpen(conversation.id);

        const result = await chatService.getConversationMessages(conversation.id, 50, 0);

        const sortedMessages = result.messages.sort((a, b) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        setMessages(sortedMessages);

        if (chatSocket) {
          chatSocket.emit('join_conversation', { conversationId: conversation.id });
          

          const hasUnreadMessages = sortedMessages.some(
            (msg) => msg.senderId !== user?.id && msg.status !== 'read'
          );

          if (hasUnreadMessages) {
          
            chatSocket.emit('mark_as_read', { conversationId: conversation.id });
        
          } 
        }

        setIsLoading(false);
      } catch (error) {
        console.error(' [useMessengerChat] Error al inicializar conversación:', error);
        setIsLoading(false);
      }
    };

    initializeConversation();

    return () => {
      if (conversationId && chatSocket) {
        chatSocket.emit('leave_conversation', { conversationId });
      
        markConversationAsClosed(conversationId);
      }
    };
  }, [contactId, chatSocket, markConversationAsOpen, markConversationAsClosed]); // eslint-disable-line react-hooks/exhaustive-deps

  useMessengerSubscriptions({
    usersSocket, chatSocket, contactId, conversationId, userId: user?.id,
    setIsTyping, setMessages, typingTimeoutRef,
  });

  // ============================================================================
  // ENVIAR MENSAJE
  // ============================================================================
  // Envío vía REST → INSERT en `messages`. Supabase Realtime se encarga del
  // broadcast a los suscriptores (ver AGENTS.md, sección Realtime).
  const sendMessage = async (
    messageContent?: string,
    media?: MessageMedia
  ): Promise<boolean> => {
    if (!user?.id || (!messageContent?.trim() && !media)) {
      return false;
    }

    let currentConversationId = conversationId;

    if (!currentConversationId) {
      try {
        const created = await chatService.createOrGetConversation(contactId);
        currentConversationId = created.id;
        setConversationId(currentConversationId);
        setConversation(created);
      } catch (error) {
        console.error('[useMessengerChat] Error creando conversación:', error);
        return false;
      }
    }

    const tempId = `temp-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      content: messageContent || '',
      media: media || null,
      conversationId: currentConversationId,
      senderId: user.id,
      createdAt: new Date().toISOString(),
      status: 'sending',
      isTemporary: true,
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const sent = await chatService.sendMessage(
        currentConversationId,
        messageContent ?? '',
        undefined,
        media,
      );

      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        if (withoutTemp.some((m) => m.id === sent.id)) return withoutTemp;
        return [...withoutTemp, sent].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
      return true;
    } catch (error) {
      console.error('[useMessengerChat] Error al enviar mensaje:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return false;
    }
  };

  // ============================================================================
  // TYPING INDICATORS
  // ============================================================================
  const emitTypingStart = () => {
    if (!usersSocket || !contactId) return;

    usersSocket.emit('typing_start', { recipientId: contactId });
  };

  const emitTypingStop = () => {
    if (!usersSocket || !contactId) return;

    usersSocket.emit('typing_stop', { recipientId: contactId });
  };

  // Función para refrescar la conversación (después de habilitar/deshabilitar encriptación)
  const refreshConversation = async () => {
    if (!conversationId) return;
    
    try {
  
      const updatedConversation = await chatService.findConversationByParticipant(contactId);
      if (updatedConversation) {
        setConversation(updatedConversation);
        console.log(' [useMessengerChat] Conversación actualizada:', {
          id: updatedConversation.id,
          isEncrypted: updatedConversation.isEncrypted,
        });
      }
    } catch (error) {
      console.error('[useMessengerChat] Error refrescando conversación:', error);
    }
  };

  return {
    conversationId,
    conversation,
    messages,
    isLoading,
    isTyping,
    sendMessage,
    emitTypingStart,
    emitTypingStop,
    typingTimeoutRef,
    refreshConversation,
  };
}
