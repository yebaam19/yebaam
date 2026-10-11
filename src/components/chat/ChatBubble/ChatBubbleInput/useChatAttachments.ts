import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { MediaType } from '@/features/chat/hooks/useUploadChatMedia';
import { CHAT_AUDIO_MAX_BYTES, CHAT_FILE_MAX_BYTES, chatDocMime, normalizeChatAudioMime } from '@/features/chat/lib/chatR2Upload';

export function useChatAttachments() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Which upload pipeline the selected attachment goes through (image/audio/file).
  const [selectedKind, setSelectedKind] = useState<MediaType>(MediaType.IMAGE);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('chat.bubble.input');


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

  return { selectedFile, selectedKind, previewUrl, fileInputRef, handleFileSelect,
    handleAudioSelect, handleDocSelect, handlePaste, handleRemoveFile };
}
