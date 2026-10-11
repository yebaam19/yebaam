import {
  CameraIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  PhotoIcon,
  PlusIcon,
} from '@/components/icons/heroicons-shim';
import type { ChangeEvent, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { CHAT_AUDIO_ACCEPT, CHAT_DOC_ACCEPT } from '@/features/chat/lib/chatR2Upload';

interface AttachButtonsProps {
  compact?: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  isSending: boolean;
  onOpenCamera: () => void;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onAudioSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onDocSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  labels: {
    more: string;
    cameraPhoto: string;
    attachImage: string;
    attachAudio: string;
    attachFile: string;
  };
}

/** Left-side cluster: "+" menu (audio/document attach), camera capture, and
 *  photo attach (each option drives its own hidden file input). */
export function AttachButtons({
  compact = false,
  fileInputRef,
  isUploading,
  isSending,
  onOpenCamera,
  onFileSelect,
  onAudioSelect,
  onDocSelect,
  labels,
}: AttachButtonsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const disabled = isUploading || isSending;

  // Same outside-click/Escape dismissal as ChatEmojiPopover.
  useEffect(() => {
    if (!menuOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (menuContainerRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="flex shrink-0 items-center gap-0.5 pb-1">
      <div ref={menuContainerRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-full p-1.5 text-primary-800 transition-colors hover:bg-black/5 dark:text-primary-400 dark:hover:bg-white/10"
          title={labels.more}
          aria-expanded={menuOpen}
        >
          <PlusIcon className="h-7 w-7" aria-hidden />
        </button>
        {menuOpen && (
          <div className="absolute bottom-12 left-0 z-50 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
            {compact && <>
              <button type="button" disabled={disabled} onClick={() => { setMenuOpen(false); onOpenCamera(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10">
                <CameraIcon className="h-5 w-5" aria-hidden />{labels.cameraPhoto}
              </button>
              <button type="button" disabled={disabled} onClick={() => { setMenuOpen(false); fileInputRef.current?.click(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10">
                <PhotoIcon className="h-5 w-5" aria-hidden />{labels.attachImage}
              </button>
            </>}
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setMenuOpen(false);
                audioInputRef.current?.click();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-800 transition-colors hover:bg-black/5 disabled:opacity-50 dark:text-neutral-100 dark:hover:bg-white/10"
            >
              <MusicalNoteIcon className="h-5 w-5 text-primary-800 dark:text-primary-400" aria-hidden />
              {labels.attachAudio}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setMenuOpen(false);
                docInputRef.current?.click();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-800 transition-colors hover:bg-black/5 disabled:opacity-50 dark:text-neutral-100 dark:hover:bg-white/10"
            >
              <DocumentTextIcon className="h-5 w-5 text-primary-800 dark:text-primary-400" aria-hidden />
              {labels.attachFile}
            </button>
          </div>
        )}
        <input
          ref={audioInputRef}
          type="file"
          accept={CHAT_AUDIO_ACCEPT}
          onChange={onAudioSelect}
          className="hidden"
          disabled={disabled}
        />
        <input
          ref={docInputRef}
          type="file"
          accept={CHAT_DOC_ACCEPT}
          onChange={onDocSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>
      {!compact && <button
        type="button"
        onClick={onOpenCamera}
        disabled={disabled}
        className="rounded-full p-1.5 text-primary-800 transition-colors hover:bg-black/5 disabled:opacity-50 dark:text-primary-400 dark:hover:bg-white/10"
        title={labels.cameraPhoto}
      >
        <CameraIcon className="h-6 w-6" aria-hidden />
      </button>}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileSelect}
        className="hidden"
        disabled={disabled}
      />
      {!compact && <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="rounded-full p-1.5 text-primary-800 transition-colors hover:bg-black/5 disabled:opacity-50 dark:text-primary-400 dark:hover:bg-white/10"
        title={labels.attachImage}
      >
        <PhotoIcon className="h-6 w-6" aria-hidden />
      </button>}
    </div>
  );
}
