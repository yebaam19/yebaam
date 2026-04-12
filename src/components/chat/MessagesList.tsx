import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface MessagesListProps {
  messages: any[];
  isLoading: boolean;
  isTyping?: boolean;
  currentUserId?: string;
  contactAvatar: string;
  contactName: string;
}

export default function MessagesList({ 
  messages, 
  isLoading,
  isTyping = false,
  currentUserId,
  contactAvatar,
  contactName 
}: MessagesListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
 
  }, [messages, isLoading, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (isLoading) {

    return (
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <p className="text-neutral-500">Cargando mensajes...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <p className="text-neutral-500">No hay mensajes aún. ¡Inicia la conversación!</p>
      </div>
    );
  }


  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg, index) => {
        const isOwn = msg.senderId === currentUserId;
        
        return (
          <MessageBubble
            key={msg.id || `msg-${index}`}
            message={msg}
            isOwn={isOwn}
            contactAvatar={contactAvatar}
            contactName={contactName}
          />
        );
      })}
      
      {/* Indicador de "escribiendo..." */}
      {isTyping && (
        <TypingIndicator 
          contactName={contactName}
          contactAvatar={contactAvatar}
        />
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
