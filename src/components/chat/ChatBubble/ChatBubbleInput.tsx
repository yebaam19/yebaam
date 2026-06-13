'use client';

import type { FormEvent, KeyboardEvent } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useUploadChatMedia, MediaType } from '@/features/chat/hooks/useUploadChatMedia';
import type { MessageMedia } from '@/features/chat/types';
import CameraCaptureModal from '../CameraCaptureModal';
import { AttachmentPreview } from './ChatBubbleInput/AttachmentPreview';
import { AttachButtons } from './ChatBubbleInput/AttachButtons';
import { MessageTextArea } from './ChatBubbleInput/MessageTextArea';
import { InputActions } from './ChatBubbleInput/InputActions';

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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useAutoResizeTextArea(message, 120, 1);
  const t = useTranslations('chat.bubble.input');

  const { uploadMedia, isUploading, uploadProgress } = useUploadChatMedia();

  const applyImageFile = (file: File) => {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyImageFile(file);
  };

  // Paste a screenshot (or any copied image) straight into the message box —
  // clipboard images usually have no filename, so we give them one.
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const named = file.name?.trim()
            ? file
            : new File([file], `screenshot.${(file.type.split('/')[1] || 'png').split('+')[0]}`, { type: file.type });
          applyImageFile(named);
        }
        return;
      }
    }
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

  // Camera capture → upload (same path as the photo attach) → send.
  const handleCameraCapture = async (file: File) => {
    const result = await uploadMedia({ file, mediaType: MediaType.IMAGE });
    if (!result) {
      toast.error(t('errors.uploadFailed'));
      return;
    }
    setCameraOpen(false);
    await onSendMessage(undefined, {
      type: result.type,
      cf_image_id: result.s3Key,
      size: result.size,
      filename: result.filename,
    });
  };

  const trimmedEmpty = message.trim() === '';

  const handleThumb = async () => {
    if (isSending || !trimmedEmpty || selectedFile) return;
    setIsSending(true);
    onStopTyping();
    await onSendMessage('👍');
    setIsSending(false);
  };

  const handleSendVoice = useCallback(
    async (media: MessageMedia) => {
      await onSendMessage(undefined, media);
    },
    [onSendMessage],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-neutral-200 bg-[#f0f2f5] px-2 py-2 dark:border-neutral-800 dark:bg-neutral-900"
    >
      {previewUrl && (
        <AttachmentPreview
          previewUrl={previewUrl}
          isUploading={isUploading}
          isSending={isSending}
          uploadProgress={uploadProgress}
          onRemove={handleRemoveFile}
          labels={{ previewAlt: t('previewAlt'), removeImage: t('removeImage') }}
        />
      )}

      <div className="flex items-end gap-1.5">
        <AttachButtons
          fileInputRef={fileInputRef}
          isUploading={isUploading}
          isSending={isSending}
          onMore={stubSoon}
          onOpenCamera={() => setCameraOpen(true)}
          onFileSelect={handleFileSelect}
          labels={{
            more: t('more'),
            cameraPhoto: t('cameraPhoto'),
            attachImage: t('attachImage'),
          }}
        />

        <MessageTextArea
          textareaRef={textareaRef}
          value={message}
          disabled={isSending || isUploading}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          labels={{ placeholder: t('placeholder'), ariaLabel: t('ariaLabel') }}
        />

        <InputActions
          emojiOpen={emojiOpen}
          isSending={isSending}
          isUploading={isUploading}
          showSendAlternatives={trimmedEmpty && !selectedFile}
          onToggleEmoji={() => setEmojiOpen((v) => !v)}
          onCloseEmoji={() => setEmojiOpen(false)}
          onSelectEmoji={handleEmojiSelect}
          onSendVoice={handleSendVoice}
          onSendLike={() => void handleThumb()}
          labels={{ emoji: t('emoji'), sendLike: t('sendLike'), send: t('send') }}
        />
      </div>

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
        sending={isUploading}
      />
    </form>
  );
}
