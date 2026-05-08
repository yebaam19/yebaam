import Image from 'next/image';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import type { MessageMedia } from '@/features/chat/types';
import { imageUrl } from '@/lib/media/urls';

interface ImageModalProps {
  media: MessageMedia;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageModal({ media, isOpen, onClose }: ImageModalProps) {
  if (!isOpen || media.type !== 'image' || !media.cf_image_id) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <XMarkIcon className="w-6 h-6 text-white" />
      </button>

      <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
        <Image
          src={imageUrl(media.cf_image_id)}
          alt={media.filename || 'Imagen'}
          width={1200}
          height={800}
          className="w-auto h-auto max-w-full max-h-full object-contain"
          style={{ width: 'auto', height: 'auto' }}
          unoptimized
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
