'use client';

import { useTranslations } from 'next-intl';
import { MinusIcon, XMarkIcon, UserGroupIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import ChatOptionsMenu from '../ChatOptionsMenu';

interface ChatBubbleHeaderProps {
  contactName: string;
  contactAvatar: string;
  isOnline: boolean;
  /** Peer user id — powers the anonymous-conversation option. */
  contactId?: string;
  /** Kept so callers do not churn; estado de capa realtime no replica el copy de Messenger. */
  isChatConnected: boolean;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
  /** When set (1:1 bubbles), shows a "create group" button that starts a salita with this person. */
  onCreateGroup?: () => void;
}

export function ChatBubbleHeader({
  contactName,
  contactAvatar,
  isOnline,
  contactId,
  isChatConnected,
  isMinimized,
  onToggleMinimize,
  onClose,
  onCreateGroup,
}: ChatBubbleHeaderProps) {
  void isChatConnected;
  const t = useTranslations('chat.bubble.header');

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
              {t('activeNow')}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {onCreateGroup && (
          <button
            type="button"
            onClick={onCreateGroup}
            className="rounded-full p-1.5 text-neutral-600 transition-colors hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
            title={t('createGroup')}
            aria-label={t('createGroup')}
          >
            <UserGroupIcon className="h-5 w-5" aria-hidden />
          </button>
        )}
        {contactId && <ChatOptionsMenu recipientId={contactId} />}
        <button
          type="button"
          onClick={onToggleMinimize}
          className="rounded-full p-1.5 text-neutral-600 transition-colors hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
          title={isMinimized ? t('expand') : t('minimize')}
        >
          <MinusIcon className="h-6 w-6" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-neutral-600 transition-colors hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
          title={t('close')}
        >
          <XMarkIcon className="h-6 w-6" aria-hidden />
        </button>
      </div>
    </div>
  );
}
