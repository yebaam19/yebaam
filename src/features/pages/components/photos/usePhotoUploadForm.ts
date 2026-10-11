import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useUploadPagePhoto } from '../../hooks/usePagePhotos';

export function usePhotoUploadForm(pageId: string, onClose: () => void) {
  const t = useTranslations('pages.photos.upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadPagePhoto(pageId);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('invalidType'));
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert(t('tooLarge'));
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [t]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        caption: caption.trim() || undefined,
      });

      // Reset and close
      handleClose();
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    setIsDragging(false);
    onClose();
  };

  return {
    selectedFile,
    setSelectedFile,
    previewUrl,
    setPreviewUrl,
    caption,
    setCaption,
    isDragging,
    fileInputRef,
    uploadMutation,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileInputChange,
    handleSubmit,
    handleClose
  };
}
