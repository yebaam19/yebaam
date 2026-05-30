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
  /** True for multi-person group threads — shows per-sender name + avatar. */
  isGroup?: boolean;
  participants?: { userId: string; name: string; avatar: string }[];
}

export default function MessagesList({
  messages,
  isLoading,
  isTyping = false,
  currentUserId,
  contactAvatar,
  contactName,
  isGroup = false,
  participants = [],
}: MessagesListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4">
        <p className="text-neutral-500">Cargando mensajes...</p>
      </div>
    );
  }

  if (!isLoading && messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4">
        <p className="text-neutral-500">No hay mensajes aún. ¡Inicia la conversación!</p>
      </div>
    );
  }


  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-4">
      {messages.map((msg, index) => {
        const isOwn = msg.senderId === currentUserId;
        // In groups, label each incoming bubble with its actual sender.
        const sender = isGroup && !isOwn ? participants.find((p) => p.userId === msg.senderId) : undefined;

        return (
          <MessageBubble
            key={msg.id || `msg-${index}`}
            message={msg}
            isOwn={isOwn}
            contactAvatar={sender ? sender.avatar : contactAvatar}
            contactName={sender ? sender.name : contactName}
            senderName={isGroup && !isOwn ? sender?.name ?? contactName : undefined}
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
