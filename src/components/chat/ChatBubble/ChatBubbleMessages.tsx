'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import ImageModal from '../ImageModal';
import type { MessageMedia } from '@/features/chat/types';
import { MessageRow, type MessageRowLabels } from './ChatBubbleMessages/MessageRow';
import { TypingIndicator } from './ChatBubbleMessages/TypingIndicator';
import { useAuthStore } from '@/features/auth/store/auth.store';

export interface ChatBubbleMessagesProps {
  messages: any[];
  isLoading: boolean;
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  contactAvatar: string;
  contactName: string;
  /** Group threads: show each incoming sender's own avatar + a name label. */
  isGroup?: boolean;
  participants?: { userId: string; name: string; avatar: string }[];
  /** Edit/remove your own messages (Facebook-style). */
  onEditMessage?: (messageId: string, content: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export function ChatBubbleMessages({
  messages,
  isLoading,
  isTyping,
  messagesEndRef,
  contactAvatar,
  contactName,
  isGroup = false,
  participants = [],
  onEditMessage,
  onDeleteMessage,
}: ChatBubbleMessagesProps) {
  const user = useAuthStore((state) => state.user);
  const [zoomMedia, setZoomMedia] = useState<MessageMedia | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const t = useTranslations('chat.bubble.messages');
  const tMsg = useTranslations('chat.message');
  const locale = useLocale();

  const submitEdit = useCallback(
    (messageId: string) => {
      const next = editValue.trim();
      setEditingId(null);
      if (next && onEditMessage) onEditMessage(messageId, next);
    },
    [editValue, onEditMessage],
  );

  const startEdit = useCallback((messageId: string, content: string) => {
    setEditingId(messageId);
    setEditValue(content);
  }, []);

  const cancelEdit = useCallback(() => setEditingId(null), []);

  const deleteMessage = useCallback(
    (messageId: string) => onDeleteMessage?.(messageId),
    [onDeleteMessage],
  );

  const zoom = useCallback((media: MessageMedia) => setZoomMedia(media), []);

  const participantsById = useMemo(
    () => new Map(participants.map((p) => [p.userId, p])),
    [participants],
  );

  const formatTime = useCallback(
    (date: Date | string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);
    },
    [locale],
  );

  const initials = contactName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  const rowLabels: MessageRowLabels = useMemo(
    () => ({
      deleted: tMsg('deleted'),
      edited: tMsg('edited'),
      editAria: tMsg('editAria'),
      cancel: tMsg('cancel'),
      save: tMsg('save'),
      status: {
        read: t('status.read'),
        delivered: t('status.delivered'),
        sent: t('status.sent'),
      },
    }),
    [t, tMsg],
  );

  const scrollPadding = 'flex flex-1 flex-col overflow-y-auto bg-neutral-50 p-3 dark:bg-neutral-950';

  if (isLoading && messages.length === 0) {
    return (
      <div className={scrollPadding}>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('loading')}
          </div>
        </div>
      </div>
    );
  }

  if (!isLoading && messages.length === 0) {
    return (
      <div className={scrollPadding}>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('emptyTitle')}</p>
            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
              {t('emptySubtitle')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={scrollPadding}>
      <div className="flex flex-col">
        {messages.map((msg, index) => (
          <MessageRow
            key={msg.id || `msg-${index}`}
            msg={msg}
            index={index}
            prev={messages[index - 1]}
            next={messages[index + 1]}
            isOwn={msg.senderId === user?.id}
            isGroup={isGroup}
            contactAvatar={contactAvatar}
            contactName={contactName}
            contactInitials={initials}
            participantsById={participantsById}
            isEditing={editingId === msg.id}
            editValue={editValue}
            canEditEnabled={Boolean(onEditMessage)}
            canDeleteEnabled={Boolean(onDeleteMessage)}
            labels={rowLabels}
            formatTime={formatTime}
            onStartEdit={startEdit}
            onEditValueChange={setEditValue}
            onSubmitEdit={submitEdit}
            onCancelEdit={cancelEdit}
            onDelete={deleteMessage}
            onZoom={zoom}
          />
        ))}
      </div>

      {isTyping && (
        <TypingIndicator
          contactAvatar={contactAvatar}
          contactName={contactName}
          initials={initials}
        />
      )}

      <div ref={messagesEndRef} className="h-px shrink-0" />

      {zoomMedia && (
        <ImageModal
          media={zoomMedia}
          isOpen
          onClose={() => setZoomMedia(null)}
        />
      )}
    </div>
  );
}
