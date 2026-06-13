import { CameraIcon, PhotoIcon, PlusIcon } from '@/components/icons/heroicons-shim';
import type { ChangeEvent, RefObject } from 'react';

interface AttachButtonsProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  isSending: boolean;
  onMore: () => void;
  onOpenCamera: () => void;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  labels: { more: string; cameraPhoto: string; attachImage: string };
}

/** Left-side cluster: more, camera capture, and photo attach (with hidden file input). */
export function AttachButtons({
  fileInputRef,
  isUploading,
  isSending,
  onMore,
  onOpenCamera,
  onFileSelect,
  labels,
}: AttachButtonsProps) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 pb-1">
      <button
        type="button"
        onClick={onMore}
        className="rounded-full p-1.5 text-[#0084ff] transition-colors hover:bg-black/5 dark:text-blue-400 dark:hover:bg-white/10"
        title={labels.more}
      >
        <PlusIcon className="h-7 w-7" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onOpenCamera}
        disabled={isUploading || isSending}
        className="rounded-full p-1.5 text-[#0084ff] transition-colors hover:bg-black/5 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-white/10"
        title={labels.cameraPhoto}
      >
        <CameraIcon className="h-6 w-6" aria-hidden />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileSelect}
        className="hidden"
        disabled={isUploading || isSending}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || isSending}
        className="rounded-full p-1.5 text-[#0084ff] transition-colors hover:bg-black/5 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-white/10"
        title={labels.attachImage}
      >
        <PhotoIcon className="h-6 w-6" aria-hidden />
      </button>
    </div>
  );
}
