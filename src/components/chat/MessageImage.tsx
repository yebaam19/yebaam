import Image from 'next/image';
import type { MessageMedia } from '@/features/chat/types';

interface MessageImageProps {
  media: MessageMedia;
  onClick: () => void;
}

export default function MessageImage({ media, onClick }: MessageImageProps) {
  if (media.type !== 'image') return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative block aspect-[3/2] w-[300px] max-w-full cursor-pointer overflow-hidden rounded-t-2xl hover:opacity-90 transition-opacity"
    >
      <Image
        src={media.url}
        alt={media.filename || 'Imagen'}
        fill
        sizes="300px"
        className="object-cover"
        unoptimized
      />
    </button>
  );
}
