import { cn } from '@/lib/utils';
import type { MessageMedia } from '@/features/chat/types';
import MessageImage from './MessageImage';
import AudioMessage from './AudioMessage';
import FileMessage from './FileMessage';

interface MessageContentProps {
  content?: string;
  media?: MessageMedia | null;
  isOwn: boolean;
  /** Needed to presign audio/file media (membership-checked routes). */
  conversationId?: string;
  onImageClick: () => void;
}

export default function MessageContent({
  content,
  media,
  isOwn,
  conversationId,
  onImageClick
}: MessageContentProps) {
  const hasImage = media?.type === 'image' && Boolean(media.cf_image_id);
  const hasAudio = media?.type === 'audio' && Boolean(media.r2_key);
  const hasFile = media?.type === 'file' && Boolean(media.r2_key);

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
      {hasImage && media && <MessageImage media={media} onClick={onImageClick} />}

      {/* Nota de voz / audio adjunto */}
      {hasAudio && media && <AudioMessage media={media} conversationId={conversationId} />}

      {/* Documento adjunto (tarjeta de descarga) */}
      {hasFile && media && <FileMessage media={media} conversationId={conversationId} />}

      {/* Contenido de texto si existe */}
      {content && (
        <p className="text-sm wrap-break-word px-4 py-2">{content}</p>
      )}

      {/* Espaciador si solo hay media sin texto */}
      {!content && media && <div className="h-1"></div>}
    </div>
  );
}
