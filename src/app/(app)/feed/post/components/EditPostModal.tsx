'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth';
import { usePostStore } from '../stores/post.store';
import { getUserInitials, getFirstName } from '@/lib/user-helpers';
import { 
  createPostSchema, 
  type CreatePostInput,
} from '../validators/post.schemas';
import type { PostFeeling, PostLocation, PostGif } from '../interfaces/post.interfaces';
import Avatar from '@/ui/Avatar';

// Nuevos componentes modulares
import PostVisibilitySelector from './PostVisibilitySelector';
import PostContentEditor from './PostContentEditor';
import PostBackgroundColorPicker from './PostBackgroundColorPicker';
import PostSelectedItems from './PostSelectedItems';
import PostEnhancementsPicker from './PostEnhancementsPicker';
import FilePreviews from './FilePreviews';
import { useRef } from 'react';
import { useUpdatePost } from '../hooks/usePosts';

export default function EditPostModal() {
  const { user } = useAuth();
  const { 
    isEditModalOpen, 
    postToEdit, 
    closeEditModal, 
  } = usePostStore();
  
  // Usar TanStack Query mutation para actualizar
  const updatePostMutation = useUpdatePost();
  const isCreating = updatePostMutation.isPending;
  
  const [selectedVisibility, setSelectedVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [backgroundColor, setBackgroundColor] = useState<string | undefined>(undefined);
  const [selectedFeeling, setSelectedFeeling] = useState<PostFeeling | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<PostLocation | null>(null);
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);
  const [selectedGif, setSelectedGif] = useState<PostGif | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Estados para manejo de archivos multimedia
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      content: '',
      // No necesitamos privacy en el form ya que usamos selectedVisibility
    },
  });

  const content = watch('content');

  // Función para manejar selección de archivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validar tipo de archivo
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return isImage || isVideo;
    });

    if (validFiles.length !== files.length) {
      toast.error('Solo se permiten archivos de imagen o video');
    }

    // Limitar a 10 archivos
    const limitedFiles = validFiles.slice(0, 10);
    if (validFiles.length > 10) {
      toast.warning('Solo puedes subir hasta 10 archivos');
    }

    // Crear URLs de preview
    const newPreviewUrls = limitedFiles.map(file => URL.createObjectURL(file));
    
    setSelectedFiles(limitedFiles);
    setPreviewUrls(newPreviewUrls);
    
    // Limpiar color de fondo si se agregan archivos
    if (limitedFiles.length > 0) {
      setBackgroundColor(undefined);
    }
  };

  // Función para remover un archivo
  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Cleanup de URLs cuando se cierra el modal
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Cargar datos del post cuando se abre el modal
  useEffect(() => {
    if (isEditModalOpen && postToEdit) {
      setValue('content', postToEdit.content);
      
      // Manejar privacy value, convirtiendo 'custom' a 'friends' como fallback
      const privacyValue = postToEdit.privacy.value === 'custom' 
        ? 'friends' 
        : postToEdit.privacy.value;
      
      // No necesitamos setValue para privacy, solo actualizar el estado
      setSelectedVisibility(privacyValue);
      
      // Validar backgroundColor - solo aceptar formato hexadecimal válido
      const bgColor = postToEdit.backgroundColor;
      const isValidHex = bgColor && /^#[0-9A-Fa-f]{6}$/.test(bgColor);
      setBackgroundColor(isValidHex ? bgColor : undefined);
      
      setSelectedFeeling(postToEdit.feeling || null);
      setSelectedLocation(postToEdit.location || null);
      setTaggedUserIds(postToEdit.taggedUsers?.map(u => u.id) || []);
      setSelectedGif(postToEdit.gif || null);
    }
  }, [isEditModalOpen, postToEdit, setValue]);

  // Manejador de cierre del modal
  const handleClose = () => {
    if (isCreating) return;
    
    const hasChanges = 
      content !== postToEdit?.content ||
      selectedVisibility !== postToEdit?.privacy.value ||
      backgroundColor !== postToEdit?.backgroundColor ||
      selectedFeeling !== postToEdit?.feeling ||
      selectedLocation !== postToEdit?.location ||
      taggedUserIds.length !== (postToEdit?.taggedUsers?.length || 0) ||
      selectedGif !== postToEdit?.gif ||
      selectedFiles.length > 0;
    
    if (hasChanges) {
      const confirm = window.confirm('¿Descartar los cambios?');
      if (!confirm) return;
    }
    
    // Limpiar preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    reset();
    setBackgroundColor(undefined);
    setSelectedFeeling(null);
    setSelectedLocation(null);
    setTaggedUserIds([]);
    setSelectedGif(null);
    setShowColorPicker(false);
    setSelectedFiles([]);
    setPreviewUrls([]);
    closeEditModal();
  };

  // Manejador de envío del formulario
  const onSubmit = async (data: CreatePostInput) => {
    if (!postToEdit) return;

    try {
      console.log('[EditPostModal] onSubmit - Data del formulario:', data);
      console.log('[EditPostModal] onSubmit - Content:', data.content);
      console.log('[EditPostModal] onSubmit - Archivos seleccionados:', selectedFiles.length);
      
      // Validar backgroundColor antes de enviar
      const isValidBgColor = backgroundColor && /^#[0-9A-Fa-f]{6}$/.test(backgroundColor);
      
      let mediaFiles: Array<{
        s3Key: string;
        url: string;
        type: 'image' | 'video';
        size: number;
        mimeType: string;
        duration?: number;
      }> = [];

      // Subir nuevos archivos si hay archivos seleccionados
      if (selectedFiles.length > 0) {
        toast.info('Subiendo archivos...');
        
        // Importar el uploadService dinámicamente
        const { uploadService } = await import('@/lib/service/upload.service');
        
        const uploadResults = await uploadService.uploadMultipleFiles(
          selectedFiles,
          undefined,
          (fileIndex: number, progress: number) => {
            console.log(`Subiendo archivo ${fileIndex + 1}/${selectedFiles.length}: ${progress}%`);
          }
        );

        mediaFiles = uploadResults.map(result => ({
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
      }
      
      const updatePayload = {
        content: data.content,
        backgroundColor: isValidBgColor ? backgroundColor : undefined,
        privacy: selectedVisibility,
        feeling: selectedFeeling || undefined,
        location: selectedLocation || undefined,
        taggedUserIds: taggedUserIds.length > 0 ? taggedUserIds : undefined,
        gif: selectedGif || undefined,
        mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
      };
      
      console.log('[EditPostModal] onSubmit - Payload a enviar:', updatePayload);
 
      // Usar TanStack Query mutation
      await updatePostMutation.mutateAsync({
        postId: postToEdit.id,
        data: updatePayload,
      });
      
      toast.success('Publicación actualizada exitosamente');
      
      // Limpiar preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      reset();
      setSelectedFiles([]);
      setPreviewUrls([]);
      closeEditModal();
   
    } catch (error: any) {
      console.error('Error al actualizar publicación:', error);
      toast.error(error.message || 'Error al actualizar la publicación');
    }
  };

  if (!user || !postToEdit) return null;

  const userInitials = getUserInitials(user.username);
  const userFirstName = getFirstName(user.username);

  return (
    <Transition show={isEditModalOpen}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-xl transition-all">
                {/* Header */}
                <div className="relative border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
                  <DialogTitle className="text-center text-xl font-bold text-neutral-900 dark:text-white">
                    Editar publicación
                  </DialogTitle>
                  <button
                    onClick={handleClose}
                    disabled={isCreating}
                    className="absolute right-4 top-4 rounded-full bg-neutral-100 p-2 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XMarkIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                  {/* User Info */}
                  <div className="px-6 pt-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.avatar}
                        className="h-10 w-10"
                        initials={userInitials}
                      />
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          {user.username}
                        </p>
                        
                        {/* Visibility Selector */}
                        <PostVisibilitySelector
                          value={selectedVisibility}
                          onChange={(value) => {
                            setSelectedVisibility(value);
                            setValue('privacy', { value });
                          }}
                          disabled={isCreating}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Content Input */}
                  <div className="px-6 pt-4">
                    <PostContentEditor
                      content={content}
                      onChange={(value) => setValue('content', value)}
                      placeholder={`¿Qué estás pensando, ${userFirstName}?`}
                      backgroundColor={backgroundColor}
                      error={errors.content?.message}
                      disabled={isCreating}
                    />
                  </div>

                  {/* File Previews */}
                  {selectedFiles.length > 0 && (
                    <div className="px-6 pt-4">
                      <FilePreviews
                        previewUrls={previewUrls}
                        selectedFiles={selectedFiles}
                        onRemove={removeFile}
                      />
                    </div>
                  )}

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Selected Items (Feeling, Location, GIF) */}
                  <PostSelectedItems
                    feeling={selectedFeeling}
                    location={selectedLocation}
                    gif={selectedGif}
                    onRemoveFeeling={() => setSelectedFeeling(null)}
                    onRemoveLocation={() => setSelectedLocation(null)}
                    onRemoveGif={() => setSelectedGif(null)}
                  />

                  {/* Enhanced Actions */}
                  <div className="mx-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
                    {/* Color Picker */}
                    {!selectedGif && (
                      <PostBackgroundColorPicker
                        selectedColor={backgroundColor}
                        onColorSelect={setBackgroundColor}
                        isOpen={showColorPicker}
                        onToggle={() => setShowColorPicker(!showColorPicker)}
                        disabled={isCreating}
                      />
                    )}
                    
                    {/* Enhancement Options */}
                    <PostEnhancementsPicker
                      onFeelingSelect={setSelectedFeeling}
                      onPhotoClick={() => fileInputRef.current?.click()}
                      disabled={isCreating}
                    />
                  </div>

                  {/* Footer Actions */}
                  <div className="border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
                    <button
                      type="submit"
                      disabled={isCreating || (!content?.trim() && !selectedGif)}
                      className="w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:disabled:bg-neutral-700"
                    >
                      {isCreating ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
