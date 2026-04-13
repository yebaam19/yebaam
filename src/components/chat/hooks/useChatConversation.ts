import { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import { useChatNotifications } from '@/features/chat/context/chat-notification.context';
import type { Socket } from 'socket.io-client';

interface UseChatConversationProps {
  contactId: string;
  chatSocket: Socket | null;
}

export function useChatConversation({ contactId, chatSocket }: UseChatConversationProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const user = useAuthStore((state) => state.user);
  const { markConversationAsOpen, markConversationAsClosed } = useChatNotifications();

  // Inicializar conversación y cargar mensajes
  useEffect(() => {
    let isMounted = true; // Flag para evitar actualizaciones si el componente se desmonta

    const initializeConversation = async () => {
      try {
       
        setIsLoading(true);
        
        // Buscar o crear conversación
        let conversation = await chatService.findConversationByParticipant(contactId);
        
        if (!conversation) {
          console.log('✨ [useChatConversation] Creando nueva conversación...');
          conversation = await chatService.createOrGetConversation(contactId);
        }
        
        if (!isMounted) return; // Evitar actualización si el componente se desmontó
        
      
        setConversationId(conversation.id);
        
        // Marcar conversación como abierta
        markConversationAsOpen(conversation.id);
    
        // Cargar mensajes
        const result = await chatService.getConversationMessages(conversation.id, 50, 0);
       
        if (!isMounted) return; // Evitar actualización si el componente se desmontó
        
        // Ordenar mensajes por fecha (más antiguos primero)
        const sortedMessages = result.messages.sort((a: any, b: any) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        setMessages(sortedMessages);
        
        // Unirse a la sala WebSocket
        if (chatSocket?.connected) {
          chatSocket.emit('join_conversation', { conversationId: conversation.id });
        
          // Marcar mensajes como leídos si hay mensajes no leídos
          const hasUnreadMessages = sortedMessages.some(
            (msg: any) => msg.senderId !== user?.id && msg.status !== 'read'
          );
          
          if (hasUnreadMessages) {
         
            chatSocket.emit('mark_as_read', { conversationId: conversation.id });
          }
        }
        
        setIsLoading(false);
      } catch (error) {
       
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Solo inicializar si hay contactId y no hay conversationId ya
    if (contactId && !conversationId) {
      initializeConversation();
    }

    // Cleanup: salir de la conversación y marcarla como cerrada
    return () => {
      isMounted = false;
      if (conversationId && chatSocket?.connected) {
        
        chatSocket.emit('leave_conversation', { conversationId });
        markConversationAsClosed(conversationId);
      }
    };
  }, [contactId]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Efecto separado para reconectar al WebSocket cuando cambie
  useEffect(() => {
    if (conversationId && chatSocket?.connected) {
      chatSocket.emit('join_conversation', { conversationId });
    }
  }, [chatSocket, conversationId]);

  // Polling HTTP para nuevos mensajes mientras el WebSocket esté inactivo
  useEffect(() => {
    if (!conversationId || chatSocket?.connected) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const result = await chatService.getConversationMessages(conversationId, 50, 0);
        if (cancelled) return;
        setMessages((prev) => {
          const existingIds = new Set(prev.filter((m) => !m.isTemporary).map((m) => m.id));
          const incoming = result.messages.filter((m: any) => !existingIds.has(m.id));
          if (incoming.length === 0) return prev;
          const merged = [...prev, ...incoming];
          return merged.sort(
            (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        });
      } catch {
        // ignore transient errors; next tick will retry
      }
    };

    const interval = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId, chatSocket]);

  return {
    conversationId,
    messages,
    setMessages,
    isLoading,
  };
}
