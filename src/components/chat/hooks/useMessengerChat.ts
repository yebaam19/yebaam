import { useState, useRef, useEffect } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChatNotifications } from '@/features/chat/context/chat-notification.context';
import { chatService } from '@/features/chat/services/chat.service';
import type { MessageMedia } from '@/features/chat/types';

interface UseMessengerChatProps {
  contactId: string;
  activeChat: any;
}

export function useMessengerChat({ contactId, activeChat }: UseMessengerChatProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
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

        const sortedMessages = result.messages.sort((a: any, b: any) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        setMessages(sortedMessages);

        if (chatSocket) {
          chatSocket.emit('join_conversation', { conversationId: conversation.id });
          

          const hasUnreadMessages = sortedMessages.some(
            (msg: any) => msg.senderId !== user?.id && msg.status !== 'read'
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

  useEffect(() => {
    if (!usersSocket || !contactId) {
      return;
    }

    const handleUserTyping = (event: any) => {
 

      // Solo actualizar si el evento es del contacto con quien estamos chateando
      if (event.userId === contactId) {
        setIsTyping(event.isTyping);

        if (event.isTyping) {
          // Auto-clear después de 3 segundos por si no llega typing_stop
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        } else {
          // Limpiar timeout si recibimos typing_stop
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
        }
      }
    };

    usersSocket.on('user_typing', handleUserTyping);

    return () => {
      usersSocket.off('user_typing', handleUserTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [usersSocket, contactId]);

  // ============================================================================
  // WEBSOCKET: ESCUCHAR EVENTOS DE CHAT (mensajes, leídos)
  // ============================================================================
  useEffect(() => {
    if (!chatSocket || !conversationId) {
      return;
    }

    const handleMessageReceived = (event: any) => {


      if (event.conversationId === conversationId) {
 
        setMessages(prev => {
          const exists = prev.some(m => m.id === event.message.id);
          if (exists) {
            return prev;
          }

          const newMessages = [...prev, event.message];
          return newMessages.sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });

        if (chatSocket && event.message.senderId !== user?.id) {
     
          chatSocket.emit('mark_as_read', { conversationId });
        }
      }
    };

    const handleMessagesRead = (event: any) => {


      if (event.conversationId === conversationId && event.userId !== user?.id) {
     

        setMessages(prev => {
          const updated = prev.map(msg => {
            if (msg.senderId === user?.id && msg.status !== 'read') {
             
              return { ...msg, status: 'read' };
            }
            return msg;
          });
          

          return updated;
        });
      } else {
   
      }
    };

  
    chatSocket.on('message_received', handleMessageReceived);
    chatSocket.on('messages_read', handleMessagesRead);



    return () => {

      chatSocket.off('message_received', handleMessageReceived);
      chatSocket.off('messages_read', handleMessagesRead);
    };
  }, [chatSocket, conversationId, user?.id]);

  // ============================================================================
  // ENVIAR MENSAJE
  // ============================================================================
  // Envío vía REST → INSERT en `messages`. Supabase Realtime se encarga del
  // broadcast a los suscriptores (ver AGENTS.md, sección Realtime).
  const sendMessage = async (
    messageContent?: string,
    media?: MessageMedia
  ): Promise<boolean> => {
    if (!messageContent?.trim() && !media) {
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
    const tempMessage = {
      id: tempId,
      content: messageContent || '',
      media: media || null,
      conversationId: currentConversationId,
      senderId: user?.id,
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
