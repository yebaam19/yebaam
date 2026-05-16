'use client';

import {
  FaceSmileIcon,
  PaperAirplaneIcon,
  CameraIcon,
  PhotoIcon,
  PlusIcon,
  HandThumbUpIcon,
  XMarkIcon,
} from '@/components/icons/heroicons-shim';
import Image from 'next/image';
import type { FormEvent, KeyboardEvent } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import ChatEmojiPopover from '../ChatEmojiPopover';
import { useUploadChatMedia, MediaType } from '@/features/chat/hooks/useUploadChatMedia';
import type { MessageMedia } from '@/features/chat/types';

interface ChatBubbleInputProps {
  onSendMessage: (content?: string, media?: MessageMedia) => Promise<boolean>;
  onTypingChange: (value: string, prevValue: string) => void;
  onStopTyping: () => void;
}

/** Auto-resize helper for multiline textarea. */
function useAutoResizeTextArea(value: string, maxPx: number, minRows = 1) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const lh = Number.parseFloat(getComputedStyle(ta).lineHeight) || 18;
    const minH = minRows * lh + 14;
    ta.style.height = `${Math.min(Math.max(ta.scrollHeight, minH), maxPx)}px`;
  }, [value, maxPx, minRows]);

  return ref;
}

export function ChatBubbleInput({
  onSendMessage,
  onTypingChange,
  onStopTyping,
}: ChatBubbleInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useAutoResizeTextArea(message, 120, 1);
  const t = useTranslations('chat.bubble.input');

  const { uploadMedia, isUploading, uploadProgress } = useUploadChatMedia();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('errors.invalidImage'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('errors.imageTooLarge'));
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const prevValue = message;
    setMessage(newValue);
    onTypingChange(newValue, prevValue);
  };

  const handleEmojiSelect = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      const next = message + emoji;
      setMessage(next);
      onTypingChange(next, message);
      setEmojiOpen(false);
      return;
    }
    const start = el.selectionStart ?? message.length;
    const end = el.selectionEnd ?? message.length;
    const next = message.slice(0, start) + emoji + message.slice(end);
    setMessage(next);
    onTypingChange(next, message);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
    setEmojiOpen(false);
  };

  const submit = async () => {
    const trimmed = message.trim();
    if ((!trimmed && !selectedFile) || isSending || isUploading) return;

    setIsSending(true);
    onStopTyping();

    let mediaData: MessageMedia | undefined;
    if (selectedFile) {
      const result = await uploadMedia({ file: selectedFile, mediaType: MediaType.IMAGE });
      if (!result) {
        toast.error(t('errors.uploadFailed'));
        setIsSending(false);
        return;
      }
      mediaData = {
        type: result.type,
        cf_image_id: result.s3Key,
        size: result.size,
        filename: result.filename,
      };
    }

    setMessage('');
    handleRemoveFile();

    const ok = await onSendMessage(trimmed || undefined, mediaData);
    if (!ok) setMessage(trimmed);
    setIsSending(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  const stubSoon = useCallback(() => toast.info(t('toasts.soon')), [t]);

  const trimmedEmpty = message.trim() === '';

  const handleThumb = async () => {
    if (isSending || !trimmedEmpty || selectedFile) return;
    setIsSending(true);
    onStopTyping();
    await onSendMessage('👍');
    setIsSending(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-neutral-200 bg-[#f0f2f5] px-2 py-2 dark:border-neutral-800 dark:bg-neutral-900"
    >
      {previewUrl && (
        <div className="mb-2 px-1">
          <div className="relative h-24 w-24 overflow-hidden rounded-lg">
            <Image
              src={previewUrl}
              alt={t('previewAlt')}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={isUploading || isSending}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80 disabled:opacity-50"
              aria-label={t('removeImage')}
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
      )}

      <div className="flex items-end gap-1.5">
        <div className="flex shrink-0 items-center gap-0.5 pb-1">
          <button
            type="button"
            onClick={stubSoon}
            className="rounded-full p-1.5 text-[#0084ff] transition-colors hover:bg-black/5 dark:text-blue-400 dark:hover:bg-white/10"
            title={t('more')}
          >
            <PlusIcon className="h-7 w-7" aria-hidden />
          </button>
          <button
            type="button"
            onClick={stubSoon}
            className="rounded-full p-1.5 text-[#0084ff] transition-colors hover:bg-black/5 dark:text-blue-400 dark:hover:bg-white/10"
            title={t('cameraPhoto')}
          >
            <CameraIcon className="h-6 w-6" aria-hidden />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading || isSending}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isSending}
            className="rounded-full p-1.5 text-[#0084ff] transition-colors hover:bg-black/5 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-white/10"
            title={t('attachImage')}
          >
            <PhotoIcon className="h-6 w-6" aria-hidden />
          </button>
        </div>

        <div className="min-w-0 flex-1 pb-px">
          <textarea
            ref={textareaRef}
            value={message}
            rows={1}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder')}
            disabled={isSending || isUploading}
            aria-label={t('ariaLabel')}
            className="max-h-[120px] w-full resize-none rounded-[20px] border-0 bg-white px-3 py-2 text-sm leading-[1.36] wrap-break-word text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-blue-500/35 disabled:opacity-60 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
          />
        </div>

        <div className="flex shrink-0 items-center gap-0 pb-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setEmojiOpen((v) => !v)}
              className="rounded-full p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              title={t('emoji')}
            >
              <FaceSmileIcon className="h-6 w-6 text-[#0084ff] dark:text-blue-400" />
            </button>
            <ChatEmojiPopover
              open={emojiOpen}
              onClose={() => setEmojiOpen(false)}
              onSelect={handleEmojiSelect}
              align="right"
            />
          </div>

          {trimmedEmpty && !selectedFile ? (
            <button
              type="button"
              onClick={() => void handleThumb()}
              disabled={isSending}
              className="rounded-full p-2 transition-colors hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
              title={t('sendLike')}
            >
              <HandThumbUpIcon className="h-7 w-7 text-[#0084ff] dark:text-blue-400" aria-hidden />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSending || isUploading}
              className="rounded-full bg-[#0084ff] p-2 text-white shadow-sm transition-colors hover:bg-[#1877f2] disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
              title={t('send')}
            >
              <PaperAirplaneIcon className="h-5 w-5 rtl:rotate-180" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
