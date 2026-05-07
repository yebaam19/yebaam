import { useState } from 'react';
import { uploadService } from '@/lib/service/upload.service';

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
  url: string;
  s3Key: string;
  type: MediaType;
  size: number;
  filename: string;
}

export function useUploadChatMedia() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadMedia = async (
    params: UploadChatMediaParams
  ): Promise<ChatMediaResult | null> => {
    const { file, mediaType } = params;
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      if (mediaType === MediaType.IMAGE) {
        const { id, url } = await uploadService.uploadImage(file, (p) =>
          setUploadProgress(p),
        );
        return {
          url,
          s3Key: id,
          type: MediaType.IMAGE,
          size: file.size,
          filename: file.name,
        };
      }

      if (mediaType === MediaType.VIDEO) {
        const { uid } = await uploadService.uploadVideo(file, {
          onProgress: (p) => setUploadProgress(p),
        });
        return {
          url: `https://iframe.videodelivery.net/${uid}`,
          s3Key: uid,
          type: MediaType.VIDEO,
          size: file.size,
          filename: file.name,
        };
      }

      throw new Error(`Unsupported media type for chat upload: ${mediaType}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al subir el archivo';
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadMedia,
    isUploading,
    uploadProgress,
    error,
  };
}
