import { cn } from '@/lib/utils';
import Avatar from '@/ui/Avatar';
import { useState } from 'react';
import MessageContent from './MessageContent';
import MessageStatus from './MessageStatus';
import ImageModal from './ImageModal';
import type { Message } from '@/features/chat/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  contactAvatar?: string;
  contactName?: string;
  /** When set (group threads, incoming), shows the sender's name above the bubble. */
  senderName?: string;
}

export default function MessageBubble({
  message,
  isOwn,
  contactAvatar,
  contactName,
  senderName,
}: MessageBubbleProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

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

  return (
    <div
      className={cn('flex items-end gap-2', isOwn && 'flex-row-reverse')}
    >
      {!isOwn && (
        <Avatar
          src={contactAvatar || null}
          alt={contactName}
          initials={contactAvatar?.trim() ? undefined : peerInitials}
          className="h-7 w-7"
        />
      )}
      
      <div className={cn('flex flex-col gap-0.5', isOwn ? 'items-end' : 'items-start')}>
        {senderName && (
          <span className="px-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {senderName}
          </span>
        )}
        <MessageContent
          content={contentText}
          media={message.media}
          isOwn={isOwn}
          onImageClick={() => setIsImageModalOpen(true)}
        />
        
        {isOwn && message.status && (
          <MessageStatus status={message.status} />
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
