import { useState, useRef, useEffect } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChatNotifications } from '@/features/chat/context/chat-notification.context';
import { chatService } from '@/features/chat/services/chat.service';
import { useEncryptionStore } from '@/features/chat/store/encryption.store';
import type { MessageMedia } from '@/features/chat/types';

interface UseMessengerChatProps {
  contactId: string;
  activeChat: any;
}

// Helper para extraer texto del content (puede ser string u objeto)
const getContentText = (content: any): string => {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (content.text) return content.text;
  if (content.type === 'text' && content.text) return content.text;
  return '';
};

export function useMessengerChat({ contactId, activeChat }: UseMessengerChatProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const user = useAuthStore((state) => state.user);
  const { getPassword } = useEncryptionStore();

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

        // Obtener contraseña de encriptación si la conversación está encriptada
        const encryptionPassword = conversation.isEncrypted 
          ? getPassword(conversation.id) || undefined
          : undefined;

        if (conversation.isEncrypted && !encryptionPassword) {
          console.warn(' [useMessengerChat] Conversación encriptada pero no hay contraseña guardada');
        }

        if (encryptionPassword) {
          console.log(' [useMessengerChat] Usando contraseña de encriptación:', {
            conversationId: conversation.id,
            passwordLength: encryptionPassword.length,
            passwordPreview: encryptionPassword.substring(0, 3) + '***',
          });
        }
 
        const result = await chatService.getConversationMessages(
          conversation.id, 
          50, 
          0,
          encryptionPassword,
        );
       
        console.log(' [useMessengerChat] Primeros 3 mensajes:', result.messages.slice(0, 3).map((m: any) => {
          const contentText = getContentText(m.content);
          return {
            id: m.id?.slice(0, 8),
            content: contentText.slice(0, 20),
            status: m.status,
            senderId: m.senderId?.slice(0, 8),
            media: m.media
          };
        }));

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
  const sendMessage = async (
    messageContent?: string,
    media?: MessageMedia
  ): Promise<boolean> => {
   
    // Validar que haya al menos contenido o media
    if (!messageContent?.trim() && !media) {
   
      return false;
    }

    if (!chatSocket?.connected) {
      return false;
      return false;
    }

    // Si no hay conversationId aún, esperar a que se cree (máx 5 segundos)
    let currentConversationId = conversationId;
    
    if (!currentConversationId) {
      console.log(' [useMessengerChat] No hay conversationId, intentando crear conversación...');
      
      try {
        // Intentar crear la conversación ahora
        const conversation = await chatService.createOrGetConversation(contactId);
        currentConversationId = conversation.id;
        setConversationId(currentConversationId);
        
        // Unirse a la conversación
        if (chatSocket) {
          chatSocket.emit('join_conversation', { conversationId: currentConversationId });
        }
        
      } catch (error) {
        console.error(' [useMessengerChat] Error creando conversación:', error);
        return false;
      }
    }

    try {
      const tempMessage = {
        id: `temp-${Date.now()}`,
        content: messageContent || '',
        media: media || null,
        conversationId: currentConversationId,
        senderId: user?.id,
        createdAt: new Date().toISOString(),
        status: 'sending',
        isTemporary: true,
      };

      setMessages(prev => [...prev, tempMessage]);

      // Obtener contraseña de encriptación si la conversación está encriptada
      const encryptionPassword = currentConversationId ? getPassword(currentConversationId) : null;

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
          resolve(false);
        }, 10000);

        chatSocket.emit('send_message', {
          senderId: user?.id,
          conversationId: currentConversationId,
          content: messageContent,
          media: media || undefined,
          encryptionPassword: encryptionPassword || undefined, // Enviar contraseña si existe
        }, (response: any) => {
          clearTimeout(timeout);

          if (response?.success) {
            const newMessage = response.message || response.data?.message;

            if (newMessage) {
              setMessages(prev => {
                const filtered = prev.filter(m => m.id !== tempMessage.id);
                const exists = filtered.some(m => m.id === newMessage.id);
                if (exists) return filtered;

                const newMessages = [...filtered, newMessage];
                return newMessages.sort((a, b) =>
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
              });
              resolve(true);
            } else {
              setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
              resolve(false);
            }
          } else {
            console.error(' [useMessengerChat] Error al enviar mensaje:', response?.error || response);
            setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error(' [useMessengerChat] Error:', error);
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
