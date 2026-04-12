import { useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
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

    if (!messageContent.trim() || !conversationId || !chatSocket?.connected) {
   
      return false;
    }

    try {
      // Crear mensaje temporal optimista
      const tempMessage = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        conversationId,
        senderId: user?.id,
        createdAt: new Date().toISOString(),
        status: 'sending',
        isTemporary: true,
      };
      
      // Agregar mensaje temporal a la UI
      setMessages((prev) => [...prev, tempMessage]);
      
      // Promise para manejar respuesta del servidor
      return new Promise((resolve) => {

        const timeout = setTimeout(() => {
         
          setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
          resolve(false);
        }, 10000);
        
        // Enviar mensaje por WebSocket
        chatSocket.emit('send_message', {
          senderId: user?.id,
          conversationId,
          content: messageContent,
        }, (response: any) => {
          clearTimeout(timeout);
        
          
          if (response?.success) {
            const newMessage = response.message || response.data?.message;
            
            if (newMessage) {
            
              
              // Reemplazar mensaje temporal con el real
              setMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== tempMessage.id);
                const exists = filtered.some((m) => m.id === newMessage.id);
                
                if (exists) return filtered;
                
                const newMessages = [...filtered, newMessage];
                return newMessages.sort((a, b) => 
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
              });
              
              resolve(true);
            } else {
              
              setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
              resolve(false);
            }
          } else {
       
            setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error(' Error:', error);
      return false;
    }
  };

  return {
    sendMessage,
    messagesEndRef,
  };
}
