import { useState, useRef, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { PostFeeling, PostLocation, PostGif } from '@/app/(app)/feed/post/interfaces/post.interfaces';
import { uploadService } from '@/lib/service/upload.service';
import { 
  createPostSchema, 
  CreatePostInput, 
  validateFiles 
} from '../validators/create-post.validator';

export const useCreatePostForm = () => {
  // Form state
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      content: '',
    },
  });

  // File state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Post customization state
  const [selectedVisibility, setSelectedVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [backgroundColor, setBackgroundColor] = useState<string | undefined>(undefined);
  const [selectedFeeling, setSelectedFeeling] = useState<PostFeeling | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<PostLocation | null>(null);
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);
  const [selectedGif, setSelectedGif] = useState<PostGif | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Upload state
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const content = watch('content');

  // File handlers
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    const { valid: validFiles, errors: validationErrors } = validateFiles(files, selectedFiles);

    validationErrors.forEach(error => toast.error(error));

    if (validFiles.length === 0) return;

    // Crear previews
    const newFiles = [...selectedFiles, ...validFiles];
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));

    setSelectedFiles(newFiles);
    setPreviewUrls([...previewUrls, ...newPreviews]);
    
    toast.success(`${validFiles.length} archivo(s) agregado(s)`);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(files => files.filter((_, i) => i !== index));
    setPreviewUrls(urls => urls.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  // Upload files
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return [];

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadResults = await uploadService.uploadMultipleFiles(
        selectedFiles,
        undefined,
        (fileIndex: number, progress: number) => {
          const totalProgress = Math.round(
            ((fileIndex * 100) + progress) / selectedFiles.length
          );
          setUploadProgress(totalProgress);
        }
      );

      const mediaFiles = uploadResults.map(result => ({
        s3Key: result.s3Key,
        url: result.url,
        type: result.type,
        size: result.fileSize,
        mimeType: result.fileType,
        duration: result.duration,
        streamUid: result.streamUid,
        thumbnailUrl: result.thumbnailUrl,
      }));

      toast.success(`${selectedFiles.length} archivo(s) subido(s) exitosamente`);
      return mediaFiles;
    } catch (uploadError) {
      console.error('Error al subir archivos:', uploadError);
      toast.error('Error al subir los archivos. Intenta de nuevo.');
      throw uploadError;
    } finally {
      setIsUploading(false);
    }
  };

  // Reset all state
  const resetForm = () => {
    reset();
    clearAllFiles();
    setBackgroundColor(undefined);
    setSelectedFeeling(null);
    setSelectedLocation(null);
    setTaggedUserIds([]);
    setSelectedGif(null);
    setShowColorPicker(false);
    setUploadProgress(0);
    setIsUploading(false);
    setSelectedVisibility('public');
  };

  // Check if form has content
  const hasContent = () => {
    return !!(
      content?.trim() ||
      selectedFiles.length > 0 ||
      selectedFeeling ||
      selectedLocation ||
      taggedUserIds.length > 0 ||
      selectedGif
    );
  };

  return {
    // Form
    register,
    handleSubmit,
    errors,
    reset: resetForm,
    setValue,
    content,

    // Files
    selectedFiles,
    previewUrls,
    fileInputRef,
    handleFileSelect,
    removeFile,
    uploadFiles,

    // Customization
    selectedVisibility,
    setSelectedVisibility,
    backgroundColor,
    setBackgroundColor,
    selectedFeeling,
    setSelectedFeeling,
    selectedLocation,
    setSelectedLocation,
    taggedUserIds,
    setTaggedUserIds,
    selectedGif,
    setSelectedGif,
    showColorPicker,
    setShowColorPicker,

    // Upload
    uploadProgress,
    isUploading,

    // Helpers
    hasContent,
  };
};
