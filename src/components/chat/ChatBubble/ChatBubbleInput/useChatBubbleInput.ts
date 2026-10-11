'use client';

import type { FormEvent, KeyboardEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import { useAutoResizeTextArea } from '../../hooks/useAutoResizeTextArea';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  useUploadChatMedia,
  toMessageMedia,
  MediaType,
} from '@/features/chat/hooks/useUploadChatMedia';
import { useChatAttachments } from './useChatAttachments';
import type { MessageMedia } from '@/features/chat/types';

export interface ChatBubbleInputProps {
  onSendMessage: (content?: string, media?: MessageMedia) => Promise<boolean>;
  onTypingChange: (value: string, prevValue: string) => void;
  onStopTyping: () => void;
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
  const textareaRef = useAutoResizeTextArea(message, 120, 1);
  const t = useTranslations('chat.bubble.input');
  const { uploadMedia, isUploading, uploadProgress } = useUploadChatMedia();
  const attachments = useChatAttachments();
  const { selectedFile, selectedKind, handleRemoveFile } = attachments;
  const submitting = useRef(false);

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
    if ((!trimmed && !selectedFile) || submitting.current || isUploading) return;
    submitting.current = true;
    setIsSending(true);
    onStopTyping();
    try {
      let mediaData: MessageMedia | undefined;
      if (selectedFile) {
        const result = await uploadMedia({ file: selectedFile, mediaType: selectedKind });
        if (!result) { toast.error(t('errors.uploadFailed')); return; }
        mediaData = toMessageMedia(result);
      }
      // The send callback accepts the message into the outbox immediately.
      // Its network request never owns or restores the next draft.
      const accepted = await onSendMessage(trimmed || undefined, mediaData);
      if (accepted) {
        setMessage('');
        handleRemoveFile();
      }
    } finally {
      submitting.current = false;
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
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
    ...attachments,
    textareaRef,
    isUploading,
    uploadProgress,
    trimmedEmpty,
    handleInputChange,
    handleEmojiSelect,
    handleSubmit,
    handleKeyDown,
    handleCameraCapture,
    handleThumb,
    handleSendVoice,
  };
}
