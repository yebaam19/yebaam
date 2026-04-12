import { useState } from 'react';
import { pageProductsService } from '@/services/page-products.service';

interface UseProductImageUploadOptions {
  onSuccess?: (fileUrl: string, s3Key: string) => void;
  onError?: (error: Error) => void;
}

export function useProductImageUpload(
  pageId: string,
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
      console.log('[useProductImageUpload] Starting upload for:', file.name);

      // Step 1: Get presigned URL with file metadata
      setProgress(20);
      const uploadData = await pageProductsService.generateProductImageUploadUrl(pageId, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      console.log('[useProductImageUpload] Presigned URL received:', {
        s3Key: uploadData.s3Key,
        cloudFrontUrl: uploadData.cloudFrontUrl,
      });

      // Step 2: Upload to S3
      setProgress(50);
      await pageProductsService.uploadImageToS3(uploadData.uploadUrl, file);

      // Step 3: Complete - use cloudFrontUrl as file URL
      setProgress(100);
      
      console.log('[useProductImageUpload] Upload completed successfully');

      options?.onSuccess?.(uploadData.cloudFrontUrl, uploadData.s3Key);

      return {
        url: uploadData.cloudFrontUrl,
        s3Key: uploadData.s3Key,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al subir imagen');
      console.error('[useProductImageUpload] Upload failed:', error);
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
