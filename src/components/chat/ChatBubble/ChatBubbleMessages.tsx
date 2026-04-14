import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface ChatBubbleMessagesProps {
  messages: any[];
  isLoading: boolean;
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatBubbleMessages({
  messages,
  isLoading,
  isTyping,
  messagesEndRef,
}: ChatBubbleMessagesProps) {
  const user = useAuthStore((state) => state.user);

  // Función para extraer texto del contenido (puede ser string u objeto)
  const getContentText = (content: any): string => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      return content.text || content._value || content.value || JSON.stringify(content);
    }
    return '';
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return (
          <span className="text-xs text-primary-100 font-bold ml-1" title="Leído">
            ✓✓
          </span>
        );
      case 'delivered':
        return (
          <span className="text-xs text-primary-200 font-bold ml-1" title="Entregado">
            ✓
          </span>
        );
      case 'sent':
        return (
          <span className="text-xs text-primary-300 font-bold ml-1" title="Enviado">
            ✓
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 bg-neutral-50 dark:bg-neutral-950">
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Cargando mensajes...
          </div>
        </div>
      </div>
    );
  }

  if (!isLoading && messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 bg-neutral-50 dark:bg-neutral-950">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No hay mensajes aún
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Envía el primer mensaje
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50 dark:bg-neutral-950">
      {messages.map((msg, index) => {
        const isOwn = msg.senderId === user?.id;
        
        return (
          <div
            key={msg.id || `msg-${index}`}
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
              <p className="text-sm whitespace-pre-wrap wrap-break-word">
                {getContentText(msg.content)}
              </p>
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
                {isOwn && getMessageStatusIcon(msg.status)}
              </div>
            </div>
          </div>
        );
      })}
      
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
