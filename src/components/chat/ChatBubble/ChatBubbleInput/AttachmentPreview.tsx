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
  isSending: boolean;
  uploadProgress: number;
  onRemove: () => void;
  labels: { previewAlt: string; removeAttachment: string };
}

/** Selected-attachment preview with remove button and upload-progress overlay:
 *  image thumbnail, or a filename chip for audio/document attachments. */
export function AttachmentPreview({
  previewUrl,
  kind,
  fileName,
  fileSize,
  isUploading,
  isSending,
  uploadProgress,
  onRemove,
  labels,
}: AttachmentPreviewProps) {
  if (!previewUrl) {
    const ChipIcon = kind === MediaType.AUDIO ? MusicalNoteIcon : DocumentTextIcon;
    return (
      <div className="mb-2 px-1">
        <div className="relative flex w-fit max-w-full items-center gap-2 overflow-hidden rounded-lg bg-white px-3 py-2 pr-9 shadow-sm dark:bg-neutral-800">
          <ChipIcon className="h-5 w-5 shrink-0 text-[#0084ff] dark:text-blue-400" aria-hidden />
          <span className="min-w-0">
            <span className="block max-w-44 truncate text-sm text-neutral-800 dark:text-neutral-100">
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
            disabled={isUploading || isSending}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80 disabled:opacity-50"
            aria-label={labels.removeAttachment}
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
          aria-label={labels.removeAttachment}
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
