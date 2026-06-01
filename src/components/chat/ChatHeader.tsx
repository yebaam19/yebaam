'use client';

import { useTranslations } from 'next-intl';
import {
  InformationCircleIcon,
  XMarkIcon,
} from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import EncryptionButton from './EncryptionButton';
import ChatOptionsMenu from './ChatOptionsMenu';
import CallHeaderButtons from '@/features/chat/calls/components/CallHeaderButtons';

interface ChatHeaderProps {
  contactName: string;
  contactAvatar: string;
  isOnline: boolean;
  conversationId?: string;
  /** Real user id of the peer — enables the anonymous-conversation option. */
  peerUserId?: string;
  /** Group threads hide the 1:1 call buttons. */
  isGroup?: boolean;
  isEncrypted?: boolean;
  onRefreshConversation?: () => void;
  onClose?: () => void;
}

export default function ChatHeader({
  contactName,
  contactAvatar,
  isOnline,
  conversationId,
  peerUserId,
  isGroup = false,
  isEncrypted = false,
  onClose,
}: ChatHeaderProps) {
  const t = useTranslations('chat.header');
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
                {t('encryptedBadge')}
              </span>
            )}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {isOnline ? t('activeNow') : t('offline')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isGroup && (
          <CallHeaderButtons
            conversationId={conversationId}
            peer={peerUserId ? { id: peerUserId, name: contactName, avatar: contactAvatar } : null}
          />
        )}
        {conversationId && (
          <EncryptionButton
            conversationId={conversationId}
            isEncrypted={isEncrypted}
          />
        )}
        {peerUserId && <ChatOptionsMenu recipientId={peerUserId} />}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('closeAria')}
            className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
          </button>
        ) : (
          <button
            type="button"
            aria-label={t('infoAria')}
            className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <InformationCircleIcon className="h-5 w-5 text-primary-600" />
          </button>
        )}
      </div>
    </div>
  );
}
