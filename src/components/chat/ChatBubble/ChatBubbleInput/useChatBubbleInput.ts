'use client';

import type { FormEvent, KeyboardEvent } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  useUploadChatMedia,
  toMessageMedia,
  MediaType,
} from '@/features/chat/hooks/useUploadChatMedia';
import {
  CHAT_AUDIO_MAX_BYTES,
  CHAT_FILE_MAX_BYTES,
  chatDocMime,
  normalizeChatAudioMime,
} from '@/features/chat/lib/chatR2Upload';
import type { MessageMedia } from '@/features/chat/types';

export interface ChatBubbleInputProps {
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

/**
 * View-model for `ChatBubbleInput`: the message draft + attachment/emoji/camera
 * state, clipboard-image paste, the auto-resizing textarea, and the send
 * pipeline (upload → optimistic clear → restore on failure). The component
 * renders; this owns the composition behavior.
 */
export function useChatBubbleInput({
  onSendMessage,
  onTypingChange,
  onStopTyping,
}: ChatBubbleInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Which upload pipeline the selected attachment goes through (image/audio/file).
  const [selectedKind, setSelectedKind] = useState<MediaType>(MediaType.IMAGE);
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
    setSelectedKind(MediaType.IMAGE);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyImageFile(file);
  };

  // Audio/document attach: validate against what the chat sign routes accept,
  // then hold the file as a chip (no image preview) until send.
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!normalizeChatAudioMime(file.type)) {
      toast.error(t('errors.invalidAudio'));
      return;
    }
    if (file.size > CHAT_AUDIO_MAX_BYTES) {
      toast.error(t('errors.audioTooLarge'));
      return;
    }
    setSelectedFile(file);
    setSelectedKind(MediaType.AUDIO);
    setPreviewUrl(null);
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!chatDocMime(file.name)) {
      toast.error(t('errors.invalidFile'));
      return;
    }
    if (file.size > CHAT_FILE_MAX_BYTES) {
      toast.error(t('errors.fileTooLarge'));
      return;
    }
    setSelectedFile(file);
    setSelectedKind(MediaType.FILE);
    setPreviewUrl(null);
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
    setSelectedKind(MediaType.IMAGE);
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
      const result = await uploadMedia({ file: selectedFile, mediaType: selectedKind });
      if (!result) {
        toast.error(t('errors.uploadFailed'));
        setIsSending(false);
        return;
      }
      mediaData = toMessageMedia(result);
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

  // Camera capture → upload (same path as the photo attach) → send.
  const handleCameraCapture = async (file: File) => {
    const result = await uploadMedia({ file, mediaType: MediaType.IMAGE });
    if (!result) {
      toast.error(t('errors.uploadFailed'));
      return;
    }
    setCameraOpen(false);
    await onSendMessage(undefined, toMessageMedia(result));
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

  return {
    message,
    isSending,
    emojiOpen,
    setEmojiOpen,
    cameraOpen,
    setCameraOpen,
    selectedFile,
    selectedKind,
    previewUrl,
    fileInputRef,
    textareaRef,
    isUploading,
    uploadProgress,
    trimmedEmpty,
    handleFileSelect,
    handleAudioSelect,
    handleDocSelect,
    handlePaste,
    handleRemoveFile,
    handleInputChange,
    handleEmojiSelect,
    handleSubmit,
    handleKeyDown,
    handleCameraCapture,
    handleThumb,
    handleSendVoice,
  };
}
