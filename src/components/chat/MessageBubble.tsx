import { cn } from '@/lib/utils';
import Avatar from '@/ui/Avatar';
import { useEffect, useState } from 'react';
import MessageContent from './MessageContent';
import MessageStatus from './MessageStatus';
import ImageModal from './ImageModal';

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  contactAvatar?: string;
  contactName?: string;
}

export default function MessageBubble({ 
  message, 
  isOwn, 
  contactAvatar, 
  contactName 
}: MessageBubbleProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Debug: log para ver el status y cuando cambia
  useEffect(() => {
    if (isOwn && message.status) {
      console.log(`${message.id?.slice(0, 8)} - Status: ${message.status}`);
    }
  }, [message.status, message.id, isOwn]);

  // Extraer el texto del content - puede ser string u objeto {type, text} o {_value}
  const getContentText = (content: any): string => {
 
    if (!content) return '';
    if (typeof content === 'string') {
    
      return content;
    }
    if (typeof content === 'object') {
      const text = content.text || content._value || content.value || '';
    
      return text;
    }
    return '';
  };

  const contentText = getContentText(message.content);


  return (
    <div
      className={cn('flex items-end gap-2', isOwn && 'flex-row-reverse')}
    >
      {!isOwn && (
        <Avatar
          src={contactAvatar}
          alt={contactName}
          className="h-7 w-7"
        />
      )}
      
      <div className="flex flex-col items-end gap-0.5">
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
