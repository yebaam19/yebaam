import { cn } from '@/lib/utils';
import type { ChatMessage, MessageMedia } from '@/features/chat/types';
import MessageImage from '../../MessageImage';
import AudioMessage from '../../AudioMessage';
import FileMessage from '../../FileMessage';
import { MessageStatusIcon, type MessageStatusLabels } from './MessageStatusIcon';

interface MessageRowContentProps {
  msg: ChatMessage;
  contentText: string;
  bubbleRadii: string;
  isOwn: boolean;
  labels: { edited: string; status: MessageStatusLabels };
  formatTime: (date: Date | string) => string;
  onZoom: (media: MessageMedia) => void;
}

export function MessageRowContent({ msg, contentText, bubbleRadii, isOwn, labels, formatTime, onZoom }: MessageRowContentProps) {
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
          ? 'bg-primary-800 text-white'
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
              isOwn ? 'text-white/90' : 'text-neutral-500 dark:text-neutral-400',
            )}
          >
            {formatTime(msg.createdAt)}
          </p>
          {msg.editedAt && (
            <span
              className={cn(
                'text-[10px]',
                isOwn ? 'text-white/90' : 'text-neutral-400 dark:text-neutral-500',
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
}
