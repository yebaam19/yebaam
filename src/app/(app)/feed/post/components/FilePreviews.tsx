import { XMarkIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

interface FilePreviewsProps {
  previewUrls: string[];
  selectedFiles: File[];
  onRemove: (index: number) => void;
}

export default function FilePreviews({ previewUrls, selectedFiles, onRemove }: FilePreviewsProps) {
  if (previewUrls.length === 0) return null;

  return (
    <div
      className={cn(
        'grid gap-2 rounded-lg border border-neutral-200 p-2 dark:border-neutral-800',
        previewUrls.length === 1 && 'grid-cols-1',
        previewUrls.length === 2 && 'grid-cols-2',
        previewUrls.length >= 3 && 'grid-cols-3'
      )}
    >
      {previewUrls.map((url, index) => {
        const file = selectedFiles[index];
        const isVideo = file.type.startsWith('video/');

        return (
          <div
            key={index}
            className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800"
          >
            {isVideo ? (
              <>
                <video
                  src={url}
                  className="h-full w-full object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <PlayIcon className="h-12 w-12 text-white drop-shadow-lg" />
                </div>
              </>
            ) : (
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="h-full w-full object-cover"
              />
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute top-2 right-2 rounded-full bg-neutral-900/80 p-1.5 hover:bg-neutral-900 transition-colors"
            >
              <XMarkIcon className="h-4 w-4 text-white" />
            </button>

            {/* File info */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-2">
              <p className="text-xs text-white truncate">
                {file.name}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
