import { PhotoIcon, FaceSmileIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface ChatInputFormProps {
  message: string;
  onMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
}

export default function ChatInputForm({
  message,
  onMessageChange,
  onSubmit,
  disabled = false,
}: ChatInputFormProps) {
  return (
    <form onSubmit={onSubmit} className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          title="Adjuntar imagen"
        >
          <PhotoIcon className="w-5 h-5 text-primary-600 dark:text-primary-500" />
        </button>
        
        <input
          type="text"
          value={message}
          onChange={onMessageChange}
          placeholder="Escribe un mensaje..."
          disabled={disabled}
          className="flex-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        
        <button
          type="button"
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          title="Emoji"
        >
          <FaceSmileIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </button>
        
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="p-2 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 disabled:dark:bg-neutral-700 rounded-full transition-colors"
          title="Enviar"
        >
          <PaperAirplaneIcon className="w-5 h-5 text-white" />
        </button>
      </div>
    </form>
  );
}
