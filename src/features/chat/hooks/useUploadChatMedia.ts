import { useState } from 'react';
import axios from 'axios';
import { getAxiosInstance } from '@/lib/axios/axiosInstance';

const api = getAxiosInstance();

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
}

interface UploadChatMediaParams {
  file: File;
  mediaType: MediaType;
}

interface ChatMediaResult {
  url: string; // CloudFront URL
  s3Key: string;
  type: MediaType;
  size: number;
  filename: string;
}

/**
 * Hook para subir archivos (imágenes, videos, etc.) para mensajes de chat
 * 
 * Flujo:
 * 1. Genera presigned URL desde el backend
 * 2. Sube el archivo directamente a S3
 * 3. Retorna la URL de CloudFront para enviar en el mensaje
 */
export function useUploadChatMedia() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadMedia = async ({
    file,
    mediaType,
  }: UploadChatMediaParams): Promise<ChatMediaResult | null> => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // 1. Generar presigned URL
      const presignedResponse = await api.post<{
        success: boolean;
        data: {
          uploadUrl: string;
          s3Key: string;
          cloudFrontUrl: string;
          expiresIn: number;
        };
        message: string;
      }>('/api/conversations/media/presigned-url', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        mediaType,
      });

      const { uploadUrl, cloudFrontUrl, s3Key } = presignedResponse.data.data;

      // 2. Subir archivo a S3 usando presigned URL (sin autenticación)
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || file.size)
          );
          setUploadProgress(percentCompleted);
        },
      });

      // 3. Retornar información del archivo subido
      return {
        url: cloudFrontUrl,
        s3Key,
        type: mediaType,
        size: file.size,
        filename: file.name,
      };
    } catch (err: any) {
      console.error('Error uploading chat media:', err);
      setError(err.response?.data?.message || 'Error al subir el archivo');
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploadMedia,
    isUploading,
    uploadProgress,
    error,
  };
}
