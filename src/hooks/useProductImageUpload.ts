import { useState } from 'react';
import { uploadService } from '@/lib/service/upload.service';

interface UseProductImageUploadOptions {
  onSuccess?: (fileUrl: string, s3Key: string) => void;
  onError?: (error: Error) => void;
}

export function useProductImageUpload(
  _pageId: string,
  options?: UseProductImageUploadOptions
) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<{ url: string; s3Key: string }> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const { url, id } = await uploadService.uploadImage(file, (p) => setProgress(p));
      setProgress(100);
      options?.onSuccess?.(url, id);
      return { url, s3Key: id };
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
