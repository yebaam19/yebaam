import { MinusIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';

interface ChatBubbleHeaderProps {
  contactName: string;
  contactAvatar: string;
  isOnline: boolean;
  /** Kept so callers do not churn; estado de capa realtime no replica el copy de Messenger. */
  isChatConnected: boolean;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
}

export function ChatBubbleHeader({
  contactName,
  contactAvatar,
  isOnline,
  isChatConnected,
  isMinimized,
  onToggleMinimize,
  onClose,
}: ChatBubbleHeaderProps) {
  void isChatConnected;

  return (
    <div className="flex items-center justify-between rounded-t-xl border-b border-neutral-200/90 bg-[#f0f2f5] px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="relative shrink-0">
          <Avatar
            className="h-9 w-9 border border-white shadow-sm dark:border-neutral-700"
            src={contactAvatar}
            initials={contactName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          />
          {isOnline && (
            <div className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-[#f0f2f5] bg-emerald-500 dark:border-neutral-900" />
          )}
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <h3 className="truncate text-[15px] font-bold leading-tight text-neutral-900 dark:text-white">
            {contactName}
          </h3>
          {!isMinimized && isOnline && (
            <p className="truncate text-[12px] text-neutral-500 dark:text-neutral-400">
              Activo ahora
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onToggleMinimize}
          className="rounded-full p-1.5 text-neutral-600 transition-colors hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
          title={isMinimized ? 'Expandir' : 'Minimizar'}
        >
          <MinusIcon className="h-6 w-6" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-neutral-600 transition-colors hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
          title="Cerrar"
        >
          <XMarkIcon className="h-6 w-6" aria-hidden />
        </button>
      </div>
    </div>
  );
}
