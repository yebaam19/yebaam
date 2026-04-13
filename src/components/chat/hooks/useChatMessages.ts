import { useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import type { Socket } from 'socket.io-client';

interface UseChatMessagesProps {
  conversationId: string | null;
  chatSocket: Socket | null;
  messages: any[];
  setMessages: Dispatch<SetStateAction<any[]>>;
}

export function useChatMessages({
  conversationId,
  chatSocket,
  messages,
  setMessages,
}: UseChatMessagesProps) {
  const user = useAuthStore((state) => state.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Escuchar mensajes recibidos por WebSocket
  useEffect(() => {
    if (!chatSocket || !conversationId) {
      return;
    }

    const handleMessageReceived = (event: any) => {
   
      if (event.conversationId === conversationId) {
     
        setMessages((prev) => {
          // Evitar duplicados
          const exists = prev.some((m) => m.id === event.message.id);
          if (exists) {

            return prev;
          }
          
          // Agregar y mantener orden cronológico
          const newMessages = [...prev, event.message];
          return newMessages.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
        
        // Marcar como leído automáticamente si no es mi mensaje
        if (chatSocket && event.message.senderId !== user?.id) {
    
          chatSocket.emit('mark_as_read', { conversationId });
        }
      }
    };

    const handleMessagesRead = (event: any) => {

      
      if (event.conversationId === conversationId && event.userId !== user?.id) {
      
        
        // Actualizar todos los mensajes del usuario actual a 'read'
        setMessages((prev) => 
          prev.map((msg) => {
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
  }, [chatSocket, conversationId, user?.id, setMessages]);

  // Auto-scroll al final cuando hay mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Función para enviar mensaje
  const sendMessage = async (messageContent: string): Promise<boolean> => {
    const trimmed = messageContent.trim();
    if (!trimmed || !conversationId) {
      return false;
    }

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      content: trimmed,
      conversationId,
      senderId: user?.id,
      createdAt: new Date().toISOString(),
      status: 'sending',
      isTemporary: true,
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const newMessage = await chatService.sendMessage(conversationId, trimmed);

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempId);
        if (filtered.some((m) => m.id === newMessage.id)) return filtered;
        return [...filtered, newMessage].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });

      return true;
    } catch (error) {
      console.error('[useChatMessages] sendMessage failed:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return false;
    }
  };

  return {
    sendMessage,
    messagesEndRef,
  };
}
