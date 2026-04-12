import { RefObject } from 'react';
import MessageBubble from './MessageBubble';

interface ChatMessagesListProps {
  messages: any[];
  isLoading: boolean;
  isTyping: boolean;
  userId?: string;
  contactAvatar: string;
  contactName: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export default function ChatMessagesList({
  messages,
  isLoading,
  isTyping,
  userId,
  contactAvatar,
  contactName,
  messagesEndRef,
}: ChatMessagesListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-neutral-50 dark:bg-neutral-950">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {messages.map((msg, index) => {
            const isOwn = msg.senderId === userId;
            
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
        </>
      )}
      
      {/* Indicador de "está escribiendo" */}
      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-neutral-200 dark:bg-neutral-700 rounded-2xl px-4 py-3 rounded-bl-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-neutral-500 dark:bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-neutral-500 dark:bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-neutral-500 dark:bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
