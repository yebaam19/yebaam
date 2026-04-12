import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { Socket } from 'socket.io-client';

interface UseTypingIndicatorProps {
  conversationId: string | null;
  chatSocket: Socket | null;
}

export function useTypingIndicator({ conversationId, chatSocket }: UseTypingIndicatorProps) {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const user = useAuthStore((state) => state.user);

  // Escuchar eventos de "está escribiendo"
  useEffect(() => {
    if (!chatSocket || !conversationId) {
      return;
    }

    const handleUserTyping = (event: any) => {
      console.log('⌨️ [useTypingIndicator] Usuario escribiendo:', event);
      
      if (event.conversationId === conversationId && event.userId !== user?.id) {
        setIsTyping(event.isTyping);
        
        if (event.isTyping) {
          // Limpiar timeout anterior
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          
          // Auto-ocultar después de 3 segundos
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
      }
    };

    chatSocket.on('user_typing', handleUserTyping);

    return () => {
      chatSocket.off('user_typing', handleUserTyping);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatSocket, conversationId, user?.id]);

  // Funciones para emitir eventos de typing
  const startTyping = () => {
    if (!chatSocket || !conversationId) return;
    console.log('⌨️ [useTypingIndicator] Emitiendo typing_start');
    chatSocket.emit('typing_start', { conversationId });
  };

  const stopTyping = () => {
    if (!chatSocket || !conversationId) return;
    console.log('⏹️ [useTypingIndicator] Emitiendo typing_stop');
    chatSocket.emit('typing_stop', { conversationId });
  };

  // Manejar cambios en el input con debounce automático
  const handleInputChange = (value: string, prevValue: string) => {
    if (!conversationId || !chatSocket) return;

    // Si empieza a escribir, emitir typing_start
    if (value.length === 1 && prevValue.length === 0) {
      startTyping();
    }

    // Limpiar timeout previo
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Si hay texto, configurar timeout para typing_stop
    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 2000);
    } else {
      // Si borra todo, emitir typing_stop inmediatamente
      stopTyping();
    }
  };

  return {
    isTyping,
    startTyping,
    stopTyping,
    handleInputChange,
  };
}
