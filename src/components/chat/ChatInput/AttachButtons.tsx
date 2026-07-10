import {
  DocumentTextIcon,
  FaceSmileIcon,
  MusicalNoteIcon,
  PhotoIcon,
} from '@/components/icons/heroicons-shim';
import type { ChangeEvent, RefObject } from 'react';
import { useRef } from 'react';
import { CHAT_AUDIO_ACCEPT, CHAT_DOC_ACCEPT } from '@/features/chat/lib/chatR2Upload';
import ChatEmojiPopover from '../ChatEmojiPopover';

interface AttachButtonsProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  emojiOpen: boolean;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onAudioSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onDocSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onToggleEmoji: () => void;
  onCloseEmoji: () => void;
  onSelectEmoji: (emoji: string) => void;
}

/** Left-side cluster: photo/audio/document attach (each with its hidden file
 *  input) and emoji popover. */
export function AttachButtons({
  fileInputRef,
  isUploading,
  emojiOpen,
  onFileSelect,
  onAudioSelect,
  onDocSelect,
  onToggleEmoji,
  onCloseEmoji,
  onSelectEmoji,
}: AttachButtonsProps) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

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
      <input
        ref={audioInputRef}
        type="file"
        accept={CHAT_AUDIO_ACCEPT}
        onChange={onAudioSelect}
        className="hidden"
        disabled={isUploading}
      />
      <input
        ref={docInputRef}
        type="file"
        accept={CHAT_DOC_ACCEPT}
        onChange={onDocSelect}
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
      <button
        type="button"
        onClick={() => audioInputRef.current?.click()}
        disabled={isUploading}
        className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Adjuntar audio"
      >
        <MusicalNoteIcon className="h-5 w-5 text-primary-600" />
      </button>
      <button
        type="button"
        onClick={() => docInputRef.current?.click()}
        disabled={isUploading}
        className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Adjuntar archivo"
      >
        <DocumentTextIcon className="h-5 w-5 text-primary-600" />
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
