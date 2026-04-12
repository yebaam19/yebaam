import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ChatBubbleMessagesProps {
  messages: any[];
  isLoadingConversation: boolean;
  currentUserId?: string;
}

export default function ChatBubbleMessages({
  messages,
  isLoadingConversation,
  currentUserId,
}: ChatBubbleMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automático cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  if (isLoadingConversation) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50 dark:bg-neutral-950">
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Cargando conversación...
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50 dark:bg-neutral-950">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No hay mensajes aún
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Envía el primer mensaje 👋
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50 dark:bg-neutral-950">
      {messages.map((msg) => {
        const isOwn = msg.senderId === currentUserId;

        return (
          <div
            key={msg.id}
            className={cn(
              "flex",
              isOwn ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2",
                isOwn
                  ? "bg-primary-600 text-white rounded-br-sm"
                  : "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-sm"
              )}
            >
              <p className="text-sm whitespace-pre-wrap wrap-break-word">{msg.content}</p>
              <div className="flex items-center gap-1 mt-1">
                <p
                  className={cn(
                    "text-xs",
                    isOwn
                      ? "text-primary-100"
                      : "text-neutral-500 dark:text-neutral-400"
                  )}
                >
                  {formatTime(msg.createdAt)}
                </p>
                {isOwn && (
                  <span className="text-xs text-primary-100">
                    {msg.status === 'read' && '✓✓'}
                    {msg.status === 'delivered' && '✓'}
                    {msg.status === 'sent' && '•'}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
