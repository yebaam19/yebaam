'use client';

import Avatar from '@/ui/Avatar';
import { cn } from '@/lib/utils';
import MessageImage from '../../MessageImage';
import AudioMessage from '../../AudioMessage';
import FileMessage from '../../FileMessage';
import type { MessageMedia } from '@/features/chat/types';
import { CheckIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { MessageActionsMenu } from '../MessageActionsMenu';
import { MessageStatusIcon, type MessageStatusLabels } from './MessageStatusIcon';
import {
  getContentText,
  incomingBubbleRadii,
  initialsOf,
  outgoingBubbleRadii,
} from './helpers';

export interface MessageRowLabels {
  deleted: string;
  edited: string;
  editAria: string;
  cancel: string;
  save: string;
  status: MessageStatusLabels;
}

export interface MessageRowProps {
  /* Messages flow in untyped from the parent's `messages: any[]` prop (matches original). */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  msg: any;
  index: number;
  prev: any | undefined;
  next: any | undefined;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  isOwn: boolean;
  isGroup: boolean;
  contactAvatar: string;
  contactName: string;
  contactInitials: string;
  participantsById: Map<string, { userId: string; name: string; avatar: string }>;
  isEditing: boolean;
  editValue: string;
  canEditEnabled: boolean;
  canDeleteEnabled: boolean;
  labels: MessageRowLabels;
  formatTime: (date: Date | string) => string;
  onStartEdit: (messageId: string, content: string) => void;
  onEditValueChange: (value: string) => void;
  onSubmitEdit: (messageId: string) => void;
  onCancelEdit: () => void;
  onDelete: (messageId: string) => void;
  onZoom: (media: MessageMedia) => void;
}

export function MessageRow({
  msg,
  index,
  prev,
  next,
  isOwn,
  isGroup,
  contactAvatar,
  contactName,
  contactInitials,
  participantsById,
  isEditing,
  editValue,
  canEditEnabled,
  canDeleteEnabled,
  labels,
  formatTime,
  onStartEdit,
  onEditValueChange,
  onSubmitEdit,
  onCancelEdit,
  onDelete,
  onZoom,
}: MessageRowProps) {
  const sameSenderAsPrev = Boolean(prev) && prev.senderId === msg.senderId;
  const sameSenderAsNext = Boolean(next) && next.senderId === msg.senderId;
  const showPeerAvatar = !isOwn && (!prev || prev.senderId !== msg.senderId);

  // In groups, label each incoming message with its actual sender.
  const senderInfo = !isOwn && isGroup ? participantsById.get(msg.senderId) : undefined;
  const senderAvatar = senderInfo?.avatar || contactAvatar;
  const senderName = senderInfo?.name || contactName;
  const senderInitials = isGroup ? initialsOf(senderName) : contactInitials;
  const showSenderLabel = isGroup && !isOwn && showPeerAvatar;

  const bubbleRadii = isOwn
    ? outgoingBubbleRadii(sameSenderAsPrev, sameSenderAsNext)
    : incomingBubbleRadii(sameSenderAsPrev, sameSenderAsNext);

  // Removed message → "Mensaje eliminado" tombstone (no content/actions).
  if (msg.isDeleted) {
    return (
      <div
        key={msg.id || `msg-${index}`}
        className={cn('flex w-full items-end gap-2', isOwn ? 'justify-end' : 'justify-start', sameSenderAsPrev ? 'mt-0.5' : 'mt-3')}
      >
        {!isOwn && <span className="block size-7 shrink-0" aria-hidden />}
        <div className="max-w-[min(75%,240px)] rounded-2xl border border-dashed border-neutral-300 px-3 py-2 dark:border-neutral-600">
          <p className="text-xs italic text-neutral-400 dark:text-neutral-500">{labels.deleted}</p>
        </div>
      </div>
    );
  }

  const contentText = getContentText(msg.content);
  const canEdit = canEditEnabled && Boolean(contentText) && !msg.media;

  return (
    <div
      key={msg.id || `msg-${index}`}
      className={cn(
        'group flex w-full items-end gap-2',
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

      {isOwn && !isEditing && (canEditEnabled || canDeleteEnabled) && (
        <MessageActionsMenu
          align="left"
          canEdit={canEdit}
          onEdit={() => onStartEdit(msg.id, contentText)}
          onDelete={() => onDelete(msg.id)}
        />
      )}

      <div className={cn('max-w-[min(75%,240px)]', isOwn && 'flex flex-col items-end')}>
        {showSenderLabel && (
          <span className="mb-0.5 ml-1 block text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
            {senderName}
          </span>
        )}
        {isEditing ? (
          <div className="flex w-[220px] flex-col gap-1 rounded-2xl bg-neutral-100 p-2 dark:bg-neutral-800">
            <textarea
              autoFocus
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmitEdit(msg.id);
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  onCancelEdit();
                }
              }}
              aria-label={labels.editAria}
              className="max-h-28 w-full resize-none rounded-lg border-0 bg-white px-2 py-1 text-sm text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 dark:bg-neutral-900 dark:text-white"
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => onCancelEdit()}
                title={labels.cancel}
                className="rounded-md p-1 text-neutral-500 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onSubmitEdit(msg.id)}
                title={labels.save}
                className="rounded-md bg-[#0084ff] p-1 text-white hover:bg-[#1877f2]"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          (() => {
            const hasImage =
              msg.media?.type === 'image' && Boolean(msg.media?.cf_image_id);
            const hasAudio =
              msg.media?.type === 'audio' && Boolean(msg.media?.r2_key);
            const hasFile =
              msg.media?.type === 'file' && Boolean(msg.media?.r2_key);
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
                    onClick={() => onZoom(msg.media as MessageMedia)}
                  />
                )}
                {hasAudio && (
                  <AudioMessage
                    media={msg.media as MessageMedia}
                    conversationId={msg.conversationId}
                  />
                )}
                {hasFile && (
                  <FileMessage
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
                    {msg.editedAt && (
                      <span
                        className={cn(
                          'text-[10px]',
                          isOwn ? 'text-white/70' : 'text-neutral-400 dark:text-neutral-500',
                        )}
                      >
                        · {labels.edited}
                      </span>
                    )}
                    {isOwn && <MessageStatusIcon status={msg.status} labels={labels.status} />}
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
