import { useState, FormEvent } from 'react';
import { PaperAirplaneIcon, PhotoIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface ChatBubbleInputProps {
  onSendMessage: (message: string) => Promise<boolean>;
  onTypingChange: (value: string, prevValue: string) => void;
  onStopTyping: () => void;
}

export function ChatBubbleInput({
  onSendMessage,
  onTypingChange,
  onStopTyping,
}: ChatBubbleInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const prevValue = message;
    setMessage(newValue);
    onTypingChange(newValue, prevValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {

    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isSending) {
 
      return;
    }

    const messageContent = message.trim();

    setIsSending(true);
    onStopTyping();
    setMessage(''); // Limpiar input inmediatamente

    const success = await onSendMessage(messageContent);

    if (!success) {
      // Si falla, restaurar el mensaje

      setMessage(messageContent);
    }
    
    setIsSending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          title="Adjuntar imagen"
        >
          <PhotoIcon className="w-5 h-5 text-primary-600 dark:text-primary-500" />
        </button>
        
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            disabled={isSending}
            className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          />
        </div>

        <button
          type="button"
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          title="Emoji"
        >
          <FaceSmileIcon className="w-5 h-5 text-primary-600 dark:text-primary-500" />
        </button>

        <button
          type="submit"
          disabled={!message.trim() || isSending}
          className={cn(
            "p-2 rounded-full transition-colors",
            message.trim() && !isSending
              ? "bg-primary-600 hover:bg-primary-700 text-white"
              : "text-neutral-400 cursor-not-allowed"
          )}
          title="Enviar"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
