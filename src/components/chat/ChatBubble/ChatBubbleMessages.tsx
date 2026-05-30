'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Avatar from '@/ui/Avatar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/store/auth.store';
import MessageImage from '../MessageImage';
import ImageModal from '../ImageModal';
import AudioMessage from '../AudioMessage';
import type { MessageMedia } from '@/features/chat/types';

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
}

function getContentText(content: unknown): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'object' && content !== null) {
    const o = content as Record<string, unknown>;
    return String(o.text ?? o._value ?? o.value ?? JSON.stringify(content));
  }
  return '';
}

function outgoingBubbleRadii(prevSame: boolean, nextSame: boolean): string {
  if (!prevSame && !nextSame) return 'rounded-2xl rounded-br-md';
  if (!prevSame && nextSame) return 'rounded-2xl rounded-br-lg rounded-bl-2xl';
  if (prevSame && nextSame)
    return 'rounded-r-2xl rounded-l-2xl rounded-tr-md rounded-br-md rounded-tl-2xl';
  return 'rounded-2xl rounded-tr-md rounded-tl-2xl rounded-br-md';
}

function incomingBubbleRadii(prevSame: boolean, nextSame: boolean): string {
  if (!prevSame && !nextSame) return 'rounded-2xl rounded-bl-md';
  if (!prevSame && nextSame) return 'rounded-2xl rounded-bl-lg rounded-br-2xl';
  if (prevSame && nextSame)
    return 'rounded-l-2xl rounded-r-2xl rounded-tl-md rounded-bl-md rounded-tr-2xl';
  return 'rounded-2xl rounded-tl-md rounded-tr-2xl rounded-bl-md';
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
}: ChatBubbleMessagesProps) {
  const user = useAuthStore((state) => state.user);
  const [zoomMedia, setZoomMedia] = useState<MessageMedia | null>(null);
  const t = useTranslations('chat.bubble.messages');
  const locale = useLocale();

  const participantsById = new Map(participants.map((p) => [p.userId, p]));
  const initialsOf = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2);

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return (
          <span className="ml-1 text-xs font-bold text-white/80" title={t('status.read')}>
            ✓✓
          </span>
        );
      case 'delivered':
        return (
          <span className="ml-1 text-xs font-bold text-white/70" title={t('status.delivered')}>
            ✓
          </span>
        );
      case 'sent':
      case 'sending':
        return (
          <span className="ml-1 text-xs font-bold text-white/60" title={t('status.sent')}>
            ✓
          </span>
        );
      default:
        return null;
    }
  };

  const initials = contactName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

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
        {messages.map((msg, index) => {
          const prev = messages[index - 1];
          const next = messages[index + 1];
          const sameSenderAsPrev = Boolean(prev) && prev.senderId === msg.senderId;
          const sameSenderAsNext = Boolean(next) && next.senderId === msg.senderId;
          const isOwn = msg.senderId === user?.id;
          const showPeerAvatar =
            !isOwn && (!prev || prev.senderId !== msg.senderId);

          // In groups, label each incoming message with its actual sender.
          const senderInfo = !isOwn && isGroup ? participantsById.get(msg.senderId) : undefined;
          const senderAvatar = senderInfo?.avatar || contactAvatar;
          const senderName = senderInfo?.name || contactName;
          const senderInitials = isGroup ? initialsOf(senderName) : initials;
          const showSenderLabel = isGroup && !isOwn && showPeerAvatar;

          const bubbleRadii = isOwn
            ? outgoingBubbleRadii(sameSenderAsPrev, sameSenderAsNext)
            : incomingBubbleRadii(sameSenderAsPrev, sameSenderAsNext);

          return (
            <div
              key={msg.id || `msg-${index}`}
              className={cn(
                'flex w-full items-end gap-2',
                isOwn ? 'justify-end' : 'justify-start',
                sameSenderAsPrev ? 'mt-0.5' : 'mt-3',
              )}
            >
              {!isOwn && (
                <div className="flex w-7 shrink-0 flex-col justify-end pb-5">
                  {showPeerAvatar ? (
                    <Avatar
                      src={senderAvatar || null}
                      initials={senderInitials}
                      alt={senderName}
                      className="size-7"
                    />
                  ) : (
                    <span className="block size-7 shrink-0" aria-hidden />
                  )}
                </div>
              )}
              <div className={cn('max-w-[min(75%,240px)]', isOwn && 'flex flex-col items-end')}>
                {showSenderLabel && (
                  <span className="mb-0.5 ml-1 block text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    {senderName}
                  </span>
                )}
                {(() => {
                  const hasImage =
                    msg.media?.type === 'image' && Boolean(msg.media?.cf_image_id);
                  const hasAudio =
                    msg.media?.type === 'audio' && Boolean(msg.media?.r2_key);
                  const contentText = getContentText(msg.content);
                  return (
                    <div
                      className={cn(
                        'overflow-hidden',
                        bubbleRadii,
                        isOwn
                          ? 'bg-linear-to-br from-[#0084ff] to-[#5a67d8] text-white shadow-sm dark:from-[#2374e8] dark:to-[#4f5fcf]'
                          : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white',
                      )}
                    >
                      {hasImage && (
                        <MessageImage
                          media={msg.media as MessageMedia}
                          onClick={() => setZoomMedia(msg.media as MessageMedia)}
                        />
                      )}
                      {hasAudio && (
                        <AudioMessage
                          media={msg.media as MessageMedia}
                          conversationId={msg.conversationId}
                        />
                      )}
                      <div className="px-3 py-2">
                        {contentText && (
                          <p className="wrap-break-word text-sm whitespace-pre-wrap">
                            {contentText}
                          </p>
                        )}
                        <div
                          className={cn(
                            'flex items-center gap-1',
                            contentText && 'mt-1',
                          )}
                        >
                          <p
                            className={cn(
                              'text-xs',
                              isOwn ? 'text-white/80' : 'text-neutral-500 dark:text-neutral-400',
                            )}
                          >
                            {formatTime(msg.createdAt)}
                          </p>
                          {isOwn && getMessageStatusIcon(msg.status)}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {isTyping && (
        <div className="mt-2 flex justify-start gap-2">
          <div className="flex w-7 shrink-0 flex-col justify-end pb-5">
            {contactAvatar ? (
              <Avatar
                src={contactAvatar}
                initials={initials}
                alt={contactName}
                className="size-7"
              />
            ) : (
              <Avatar initials={initials} alt={contactName} className="size-7" />
            )}
          </div>
          <div className="rounded-2xl rounded-bl-md bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
            <div className="flex items-center gap-1">
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        </div>
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
