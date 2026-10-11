import { useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react';
import type { LegacySocket } from '@/socket/socket-client';
import type { ChatMessage, MessageReceivedEvent, MessagesReadEvent } from '@/features/chat/types';

interface MessengerSubscriptions {
  usersSocket: LegacySocket | null;
  chatSocket: LegacySocket | null;
  contactId: string;
  conversationId: string | null;
  userId?: string;
  setIsTyping: Dispatch<SetStateAction<boolean>>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  typingTimeoutRef: RefObject<NodeJS.Timeout | null>;
}

export function useMessengerSubscriptions({
  usersSocket, chatSocket, contactId, conversationId, userId,
  setIsTyping, setMessages, typingTimeoutRef,
}: MessengerSubscriptions) {
  useEffect(() => {
    if (!usersSocket || !contactId) {
      return;
    }

    const handleUserTyping = (event: { userId: string; isTyping: boolean }) => {
 

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
  }, [usersSocket, contactId, setIsTyping, typingTimeoutRef]);

  // ============================================================================
  // WEBSOCKET: ESCUCHAR EVENTOS DE CHAT (mensajes, leídos)
  // ============================================================================
  useEffect(() => {
    if (!chatSocket || !conversationId) {
      return;
    }

    const handleMessageReceived = (event: MessageReceivedEvent) => {


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

        if (chatSocket && event.message.senderId !== userId) {
     
          chatSocket.emit('mark_as_read', { conversationId });
        }
      }
    };

    const handleMessagesRead = (event: MessagesReadEvent) => {


      if (event.conversationId === conversationId && event.userId !== userId) {
     

        setMessages(prev => {
          const updated = prev.map((msg): ChatMessage => {
            if (msg.senderId === userId && msg.status !== 'read') {
             
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
  }, [chatSocket, conversationId, userId, setMessages]);

}
