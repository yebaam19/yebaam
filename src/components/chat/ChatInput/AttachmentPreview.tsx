import { XMarkIcon } from '@/components/icons/heroicons-shim';
import Image from 'next/image';

interface AttachmentPreviewProps {
  previewUrl: string;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  onRemove: () => void;
}

/** Selected-image thumbnail with remove button, upload-progress overlay and error text. */
export function AttachmentPreview({
  previewUrl,
  isUploading,
  uploadProgress,
  error,
  onRemove,
}: AttachmentPreviewProps) {
  return (
    <div className="mb-3">
      <div className="relative w-40 h-40 rounded-lg overflow-hidden group inline-block">
        <Image
          src={previewUrl}
          alt="Preview"
          fill
          sizes="160px"
          className="object-cover"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
        >
          <XMarkIcon className="w-4 h-4 text-white" />
        </button>
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-white text-sm font-medium">{uploadProgress}%</div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
