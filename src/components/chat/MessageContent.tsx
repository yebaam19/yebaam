import { cn } from '@/lib/utils';
import type { MessageMedia } from '@/features/chat/types';
import MessageImage from './MessageImage';

interface MessageContentProps {
  content?: string;
  media?: MessageMedia | null;
  isOwn: boolean;
  onImageClick: () => void;
}

export default function MessageContent({ 
  content, 
  media, 
  isOwn,
  onImageClick 
}: MessageContentProps) {
  return (
    <div
      className={cn(
        'max-w-md rounded-2xl overflow-hidden',
        isOwn
          ? 'bg-primary-600 text-white rounded-br-sm'
          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-sm'
      )}
    >
      {/* Imagen si existe */}
      {media && <MessageImage media={media} onClick={onImageClick} />}
      
      {/* Contenido de texto si existe */}
      {content && (
        <p className="text-sm wrap-break-word px-4 py-2">{content}</p>
      )}
      
      {/* Espaciador si solo hay media sin texto */}
      {!content && media && <div className="h-1"></div>}
    </div>
  );
}
