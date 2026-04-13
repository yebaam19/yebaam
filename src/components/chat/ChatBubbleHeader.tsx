import {
  XMarkIcon,
  MinusIcon,
  PhoneIcon,
  VideoCameraIcon,
} from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';

interface ChatBubbleHeaderProps {
  contactName: string;
  contactAvatar: string;
  isOnline: boolean;
  isConnected: boolean;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
}

export default function ChatBubbleHeader({
  contactName,
  contactAvatar,
  isOnline,
  isConnected,
  isMinimized,
  onToggleMinimize,
  onClose,
}: ChatBubbleHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-t-xl">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative">
          <Avatar
            className="h-8 w-8"
            src={contactAvatar}
            initials={contactName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          />
          {isOnline && (
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-neutral-900" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
            {contactName}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {isOnline ? 'Activo ahora' : 'Desconectado'}
            {isConnected && ' • Conectado'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          title="Llamada de voz"
        >
          <PhoneIcon className="w-4 h-4 text-primary-600 dark:text-primary-500" />
        </button>
        <button
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          title="Videollamada"
        >
          <VideoCameraIcon className="w-4 h-4 text-primary-600 dark:text-primary-500" />
        </button>
        <button
          onClick={onToggleMinimize}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          title={isMinimized ? 'Expandir' : 'Minimizar'}
        >
          <MinusIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          title="Cerrar"
        >
          <XMarkIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        </button>
      </div>
    </div>
  );
}
