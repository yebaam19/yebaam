import Image from 'next/image';
import type { MessageMedia } from '@/features/chat/types';

interface MessageImageProps {
  media: MessageMedia;
  onClick: () => void;
}

export default function MessageImage({ media, onClick }: MessageImageProps) {
  if (media.type !== 'image') return null;

  return (
    <div 
      className="relative w-full cursor-pointer hover:opacity-90 transition-opacity" 
      style={{ maxWidth: '300px' }}
      onClick={onClick}
    >
      <Image
        src={media.url}
        alt={media.filename || 'Imagen'}
        width={300}
        height={200}
        className="w-full h-auto rounded-t-2xl object-cover"
        style={{ width: '100%', height: 'auto' }}
        unoptimized
      />
    </div>
  );
}
