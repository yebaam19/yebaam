import { PhotoIcon, FaceSmileIcon } from '@/components/icons/heroicons-shim';
import type { ChangeEvent, RefObject } from 'react';
import ChatEmojiPopover from '../ChatEmojiPopover';

interface AttachButtonsProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  emojiOpen: boolean;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onToggleEmoji: () => void;
  onCloseEmoji: () => void;
  onSelectEmoji: (emoji: string) => void;
}

/** Left-side cluster: photo attach (with hidden file input) and emoji popover. */
export function AttachButtons({
  fileInputRef,
  isUploading,
  emojiOpen,
  onFileSelect,
  onToggleEmoji,
  onCloseEmoji,
  onSelectEmoji,
}: AttachButtonsProps) {
  return (
    <div className="flex gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Adjuntar imagen"
      >
        <PhotoIcon className="h-5 w-5 text-primary-600" />
      </button>
      <div className="relative">
        <button
          type="button"
          onClick={onToggleEmoji}
          title="Insertar emoji"
          className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <FaceSmileIcon className="h-5 w-5 text-primary-600" />
        </button>
        <ChatEmojiPopover
          open={emojiOpen}
          onClose={onCloseEmoji}
          onSelect={onSelectEmoji}
        />
      </div>
    </div>
  );
}
