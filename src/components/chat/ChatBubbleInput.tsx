import { useState, useRef } from 'react';
import {
  PaperAirplaneIcon,
  PhotoIcon,
  FaceSmileIcon,
  XMarkIcon,
} from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import { useUploadChatMedia, MediaType } from '@/features/chat/hooks/useUploadChatMedia';
import type { MessageMedia } from '@/features/chat/types';
import Image from 'next/image';

interface ChatBubbleInputProps {
  onSendMessage: (content?: string, media?: MessageMedia) => Promise<boolean>;
  conversationId: string | null;
  isLoadingConversation: boolean;
}

export default function ChatBubbleInput({
  onSendMessage,
  conversationId,
  isLoadingConversation,
}: ChatBubbleInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadMedia, isUploading, uploadProgress, error } = useUploadChatMedia();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          url: uploadResult.url,
          size: uploadResult.size,
          filename: uploadResult.filename,
        };
      }

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

  return (
    <form
      onSubmit={handleSendMessage}
      className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
    >
      {/* Preview de imagen seleccionada */}
      {previewUrl && (
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden group">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveFile}
              className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-white" />
            </button>
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-sm">{uploadProgress}%</div>
              </div>
            )}
          </div>
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || !conversationId}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || !conversationId || isLoadingConversation}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Adjuntar imagen"
        >
          <PhotoIcon className="w-5 h-5 text-primary-600 dark:text-primary-500" />
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="DEscribe un mensaje..."
            disabled={!conversationId || isLoadingConversation || isUploading}
            className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="button"
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          title="Emoji"
        >
          <FaceSmileIcon className="w-5 h-5 text-primary-600 dark:text-primary-500" />
        </button>

        <button
          type="submit"
          disabled={
            (!message.trim() && !selectedFile) ||
            !conversationId ||
            isLoadingConversation ||
            isUploading
          }
          className={cn(
            "p-2 rounded-full transition-colors",
            (message.trim() || selectedFile) && conversationId && !isLoadingConversation && !isUploading
              ? "bg-primary-600 hover:bg-primary-700 text-white"
              : "text-neutral-400 cursor-not-allowed"
          )}
          title="Enviar"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
