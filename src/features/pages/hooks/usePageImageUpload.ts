import { useState } from 'react';
import { uploadService } from '@/lib/service/upload.service';

export interface PageImageUploadResult {
  /** Cloudflare Images id — esto es lo que se persiste en la DB (id-first). */
  id: string;
  /** URL de entrega completa — solo para previews en el cliente. */
  url: string;
}

interface UseImageUploadOptions {
  onSuccess?: (result: PageImageUploadResult) => void;
  onError?: (error: Error) => void;
}

export function usePageImageUpload(
  _pageId: string,
  _type: 'avatar' | 'cover',
  options?: UseImageUploadOptions
) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<PageImageUploadResult> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const { id, url } = await uploadService.uploadImage(file, (p) => setProgress(p));
      setProgress(100);
      const result = { id, url };
      options?.onSuccess?.(result);
      return result;
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
