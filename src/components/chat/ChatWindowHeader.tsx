import { XMarkIcon, MinusIcon, PhoneIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import Avatar from '@/ui/Avatar';
import { usePresenceStore } from '@/features/presence/store/presence.store';

interface ChatWindowHeaderProps {
  contactId: string;
  contactName: string;
  contactAvatar: string;
  isMinimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
}

export default function ChatWindowHeader({
  contactId,
  contactName,
  contactAvatar,
  isMinimized,
  onMinimize,
  onClose,
}: ChatWindowHeaderProps) {
  // Obtener estado online en tiempo real desde el store
  const isOnline = usePresenceStore(state => state.isUserOnline(contactId));
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-t-xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar 
            src={contactAvatar} 
            alt={contactName} 
            initials={contactName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            className="h-9 w-9" 
          />
          {isOnline && (
            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-neutral-900" />
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {contactName}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {isOnline ? 'En línea' : 'Desconectado'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => {}}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          title="Llamada de voz"
        >
          <PhoneIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </button>
        <button
          onClick={() => {}}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          title="Videollamada"
        >
          <VideoCameraIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </button>
        <button
          onClick={onMinimize}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          title={isMinimized ? 'Expandir' : 'Minimizar'}
        >
          <MinusIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          title="Cerrar"
        >
          <XMarkIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </button>
      </div>
    </div>
  );
}
