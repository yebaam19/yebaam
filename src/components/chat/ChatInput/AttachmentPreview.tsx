import { DocumentTextIcon, MusicalNoteIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import Image from 'next/image';
import { MediaType } from '@/features/chat/types';
import { formatBytes } from '@/lib/upload-limits';

interface AttachmentPreviewProps {
  /** Image thumbnail data URL; null for audio/document attachments (chip). */
  previewUrl: string | null;
  kind: MediaType;
  fileName: string;
  fileSize: number;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  onRemove: () => void;
}

/** Selected-attachment preview with remove button, upload-progress overlay and
 *  error text: image thumbnail, or a filename chip for audio/documents. */
export function AttachmentPreview({
  previewUrl,
  kind,
  fileName,
  fileSize,
  isUploading,
  uploadProgress,
  error,
  onRemove,
}: AttachmentPreviewProps) {
  const ChipIcon = kind === MediaType.AUDIO ? MusicalNoteIcon : DocumentTextIcon;

  return (
    <div className="mb-3">
      {previewUrl ? (
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
      ) : (
        <div className="relative inline-flex max-w-full items-center gap-2 overflow-hidden rounded-lg bg-neutral-100 px-3 py-2 pr-10 dark:bg-neutral-800">
          <ChipIcon className="h-5 w-5 shrink-0 text-primary-600" aria-hidden />
          <span className="min-w-0">
            <span className="block max-w-60 truncate text-sm text-neutral-800 dark:text-neutral-100">
              {fileName}
            </span>
            {fileSize > 0 && (
              <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                {formatBytes(fileSize)}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1 hover:bg-black/80 transition-colors"
            aria-label="Quitar adjunto"
          >
            <XMarkIcon className="w-3.5 h-3.5 text-white" />
          </button>
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-white text-xs font-medium">{uploadProgress}%</div>
            </div>
          )}
        </div>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
