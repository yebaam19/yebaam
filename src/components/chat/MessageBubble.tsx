import { cn } from '@/lib/utils';
import Avatar from '@/ui/Avatar';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import MessageContent from './MessageContent';
import MessageStatus from './MessageStatus';
import ImageModal from './ImageModal';
import { MessageActionsMenu } from './ChatBubble/MessageActionsMenu';
import type { Message } from '@/features/chat/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  contactAvatar?: string;
  contactName?: string;
  /** When set (group threads, incoming), shows the sender's name above the bubble. */
  senderName?: string;
  /** Edit/remove your own messages (Facebook-style). */
  onEdit?: (content: string) => void;
  onDelete?: () => void;
}

export default function MessageBubble({
  message,
  isOwn,
  contactAvatar,
  contactName,
  senderName,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const t = useTranslations('chat.message');

  const contentText = typeof message.content === 'string' ? message.content : '';

  const peerInitials =
    contactName && contactName !== 'Chat'
      ? contactName
          .split(/\s+/)
          .map((n) => n[0])
          .filter(Boolean)
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '•';

  // Removed message → tombstone.
  if (message.isDeleted) {
    return (
      <div className={cn('flex items-end gap-2', isOwn && 'flex-row-reverse')}>
        {!isOwn && <span className="h-7 w-7 shrink-0" aria-hidden />}
        <div className="rounded-2xl border border-dashed border-neutral-300 px-3 py-2 dark:border-neutral-600">
          <p className="text-xs italic text-neutral-400 dark:text-neutral-500">{t('deleted')}</p>
        </div>
      </div>
    );
  }

  const canEdit = Boolean(onEdit) && Boolean(contentText) && !message.media;

  const submitEdit = () => {
    const next = editValue.trim();
    setIsEditing(false);
    if (next && onEdit) onEdit(next);
  };

  return (
    <div className={cn('group flex items-end gap-2', isOwn && 'flex-row-reverse')}>
      {!isOwn && (
        <Avatar
          src={contactAvatar || null}
          alt={contactName}
          initials={contactAvatar?.trim() ? undefined : peerInitials}
          className="h-7 w-7"
        />
      )}

      {isOwn && !isEditing && (onEdit || onDelete) && (
        <MessageActionsMenu
          canEdit={canEdit}
          onEdit={() => {
            setEditValue(contentText);
            setIsEditing(true);
          }}
          onDelete={() => onDelete?.()}
        />
      )}

      <div className={cn('flex flex-col gap-0.5', isOwn ? 'items-end' : 'items-start')}>
        {senderName && (
          <span className="px-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {senderName}
          </span>
        )}

        {isEditing ? (
          <div className="flex w-64 max-w-full flex-col gap-1 rounded-2xl bg-neutral-100 p-2 dark:bg-neutral-800">
            <textarea
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitEdit();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setIsEditing(false);
                }
              }}
              aria-label={t('editAria')}
              className="max-h-32 w-full resize-none rounded-lg border-0 bg-white px-2 py-1 text-sm text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 dark:bg-neutral-900 dark:text-white"
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                title={t('cancel')}
                className="rounded-md p-1 text-neutral-500 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={submitEdit}
                title={t('save')}
                className="rounded-md bg-primary-600 p-1 text-white hover:bg-primary-700"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <MessageContent
              content={contentText}
              media={message.media}
              isOwn={isOwn}
              onImageClick={() => setIsImageModalOpen(true)}
            />
            <div className="flex items-center gap-1">
              {message.editedAt && (
                <span className="px-1 text-[10px] text-neutral-400 dark:text-neutral-500">{t('edited')}</span>
              )}
              {isOwn && message.status && <MessageStatus status={message.status} />}
            </div>
          </>
        )}
      </div>

      {message.media && (
        <ImageModal
          media={message.media}
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}
    </div>
  );
}
