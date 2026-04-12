import { useState } from 'react';
import { pagesService } from '../services/pages.service';

interface UseImageUploadOptions {
  onSuccess?: (fileUrl: string) => void;
  onError?: (error: Error) => void;
}

export function usePageImageUpload(
  pageId: string,
  type: 'avatar' | 'cover',
  options?: UseImageUploadOptions
) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Paso 1: Obtener URL presigned con metadata del archivo
      setProgress(20);
      const uploadData =
        type === 'avatar'
          ? await pagesService.generateProfileImageUploadUrl({
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
            })
          : await pagesService.generateCoverImageUploadUrl({
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
            });

      // Paso 2: Subir a S3
      setProgress(50);
      await pagesService.uploadImageToS3(uploadData.uploadUrl, file);

      // Paso 3: Completado - usar cloudFrontUrl como fileUrl
      setProgress(100);
      options?.onSuccess?.(uploadData.cloudFrontUrl);

      return uploadData.cloudFrontUrl;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al subir imagen');
      setError(error.message);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  };

  return {
    uploadImage,
    isUploading,
    progress,
    error,
    reset,
  };
}
