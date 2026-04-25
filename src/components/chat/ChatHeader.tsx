import {
  InformationCircleIcon,
  XMarkIcon,
} from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import EncryptionButton from './EncryptionButton';

interface ChatHeaderProps {
  contactName: string;
  contactAvatar: string;
  isOnline: boolean;
  conversationId?: string;
  isEncrypted?: boolean;
  onRefreshConversation?: () => void;
  onClose?: () => void;
}

export default function ChatHeader({
  contactName,
  contactAvatar,
  isOnline,
  conversationId,
  isEncrypted = false,
  onClose,
}: ChatHeaderProps) {
  return (
    <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
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
        <div>
          <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            {contactName}
            {isEncrypted && (
              <span className="text-xs text-primary-600 dark:text-primary-500 font-normal">
                 Encriptado
              </span>
            )}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {isOnline ? 'Activo ahora' : 'Desconectado'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {conversationId && (
          <EncryptionButton 
            conversationId={conversationId} 
            isEncrypted={isEncrypted}
          />
        )}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar chat"
            className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
          </button>
        ) : (
          <button className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <InformationCircleIcon className="h-5 w-5 text-primary-600" />
          </button>
        )}
      </div>
    </div>
  );
}
