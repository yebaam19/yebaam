import { useState, useRef } from 'react';
import {
  PaperAirplaneIcon,
  PhotoIcon,
  FaceSmileIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
} from '@/components/icons/heroicons-shim';
import { useUploadChatMedia, MediaType } from '@/features/chat/hooks/useUploadChatMedia';
import type { MessageMedia } from '@/features/chat/types';
import Image from 'next/image';

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
          url: uploadResult.url,
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

  return (
    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
      {/* Preview de imagen seleccionada */}
      {previewUrl && (
        <div className="mb-3">
          <div className="relative w-40 h-40 rounded-lg overflow-hidden group inline-block">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveFile}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-white" />
            </button>
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-white text-sm font-medium">{uploadProgress}%</div>
              </div>
            )}
          </div>
          {error && (
            <p className="text-xs text-red-500 mt-2">{error}</p>
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
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
          <button className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <FaceSmileIcon className="h-5 w-5 text-primary-600" />
          </button>
          <button className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <EllipsisVerticalIcon className="h-5 w-5 text-primary-600" />
          </button>
        </div>

        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Aa"
            disabled={isUploading}
            className="w-full rounded-full bg-neutral-100 dark:bg-neutral-800 px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          onClick={handleSendMessage}
          disabled={(!message.trim() && !selectedFile) || isUploading}
          className="rounded-full p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PaperAirplaneIcon className="h-5 w-5 text-primary-600" />
        </button>
      </div>
    </div>
  );
}
