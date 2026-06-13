import { useState, useRef } from 'react';
import { useUploadChatMedia, MediaType } from '@/features/chat/hooks/useUploadChatMedia';
import type { MessageMedia } from '@/features/chat/types';
import { AttachmentPreview } from './ChatInput/AttachmentPreview';
import { AttachButtons } from './ChatInput/AttachButtons';
import { MessageInput } from './ChatInput/MessageInput';
import { SendButton } from './ChatInput/SendButton';

interface ChatInputProps {
  onSendMessage: (content?: string, media?: MessageMedia) => Promise<boolean>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  typingTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

export default function ChatInput({ 
  onSendMessage, 
  onTypingStart, 
  onTypingStop,
  typingTimeoutRef 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const handleEmojiSelect = (emoji: string) => {
    const el = textInputRef.current;
    if (!el) {
      setMessage((m) => m + emoji);
      setEmojiOpen(false);
      return;
    }
    const start = el.selectionStart ?? message.length;
    const end = el.selectionEnd ?? message.length;
    const next = message.slice(0, start) + emoji + message.slice(end);
    setMessage(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
    setEmojiOpen(false);
  };

  const { uploadMedia, isUploading, uploadProgress, error } = useUploadChatMedia();

  const applyImageFile = (file: File) => {
    // Validar tipo de archivo (solo imágenes por ahora)
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen');
      return;
    }

    // Validar tamaño (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen no puede superar 10MB');
      return;
    }

    setSelectedFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyImageFile(file);
  };

  // Paste a screenshot (or any copied image) directly into the message box.
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
   
    setMessage(value);

    // Si empieza a escribir, emitir typing_start
    if (value.length === 1) {
      onTypingStart();
    }

    // Limpiar timeout previo
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Si hay texto, configurar timeout para typing_stop después de 2 segundos de inactividad
    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        onTypingStop();
      }, 2000);
    } else {
      // Si borra todo, emitir typing_stop inmediatamente
      onTypingStop();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que haya mensaje o archivo
    if (!message.trim() && !selectedFile) {
     
      return;
    }

    const messageContent = message.trim();
    let mediaData: MessageMedia | undefined;

    try {
      // Si hay archivo, subirlo primero
      if (selectedFile) {
        const uploadResult = await uploadMedia({
          file: selectedFile,
          mediaType: MediaType.IMAGE,
        });

        if (!uploadResult) {
          alert('Error al subir la imagen');
          return;
        }

        mediaData = {
          type: uploadResult.type,
          cf_image_id: uploadResult.s3Key,
          size: uploadResult.size,
          filename: uploadResult.filename,
        };
      }

      onTypingStop();
      
      // Limpiar input inmediatamente
      setMessage('');
      handleRemoveFile();

      // Enviar mensaje con o sin media
      const success = await onSendMessage(
        messageContent || undefined,
        mediaData
      );
      
      // Si falló, restaurar el mensaje
      if (!success) {
        setMessage(messageContent);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(messageContent);
      alert('Error al enviar el mensaje');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
      {/* Preview de imagen seleccionada */}
      {previewUrl && (
        <AttachmentPreview
          previewUrl={previewUrl}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          error={error}
          onRemove={handleRemoveFile}
        />
      )}

      <div className="flex items-end gap-2">
        <AttachButtons
          fileInputRef={fileInputRef}
          isUploading={isUploading}
          emojiOpen={emojiOpen}
          onFileSelect={handleFileSelect}
          onToggleEmoji={() => setEmojiOpen((v) => !v)}
          onCloseEmoji={() => setEmojiOpen(false)}
          onSelectEmoji={handleEmojiSelect}
        />

        <MessageInput
          textInputRef={textInputRef}
          value={message}
          disabled={isUploading}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
        />

        <SendButton
          disabled={(!message.trim() && !selectedFile) || isUploading}
          onSend={handleSendMessage}
        />
      </div>
    </div>
  );
}
