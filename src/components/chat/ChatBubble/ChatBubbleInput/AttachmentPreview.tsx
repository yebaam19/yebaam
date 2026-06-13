import { XMarkIcon } from '@/components/icons/heroicons-shim';
import Image from 'next/image';

interface AttachmentPreviewProps {
  previewUrl: string;
  isUploading: boolean;
  isSending: boolean;
  uploadProgress: number;
  onRemove: () => void;
  labels: { previewAlt: string; removeImage: string };
}

/** Selected-image thumbnail with remove button and upload-progress overlay. */
export function AttachmentPreview({
  previewUrl,
  isUploading,
  isSending,
  uploadProgress,
  onRemove,
  labels,
}: AttachmentPreviewProps) {
  return (
    <div className="mb-2 px-1">
      <div className="relative h-24 w-24 overflow-hidden rounded-lg">
        <Image
          src={previewUrl}
          alt={labels.previewAlt}
          fill
          sizes="96px"
          className="object-cover"
          unoptimized
        />
        <button
          type="button"
          onClick={onRemove}
          disabled={isUploading || isSending}
          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80 disabled:opacity-50"
          aria-label={labels.removeImage}
        >
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-xs font-medium text-white">{uploadProgress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
