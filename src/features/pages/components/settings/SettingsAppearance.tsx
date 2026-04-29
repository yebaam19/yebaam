import { FC, useState, useRef } from 'react';
import Image from 'next/image';
import { PhotoIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { Page } from '../../types/page.types';
import { usePageImageUpload } from '../../hooks/usePageImageUpload';
import { useUpdatePage } from '../../hooks/usePages';
import { toast } from 'sonner';

interface SettingsAppearanceProps {
  page: Page;
}

export const SettingsAppearance: FC<SettingsAppearanceProps> = ({ page }) => {
  const [profileImage, setProfileImage] = useState<string | null>(page.profileImageUrl || null);
  const [coverImage, setCoverImage] = useState<string | null>(page.coverImageUrl || null);
  
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Hooks for image upload
  const {
    uploadImage: uploadProfileImage,
    isUploading: isUploadingProfile,
    progress: profileProgress
  } = usePageImageUpload(page.id, 'avatar', {
    onSuccess: (fileUrl) => {
      setProfileImage(fileUrl);
      // Update page with new profile image
      updatePage.mutate({ 
        pageId: page.id, 
        data: { avatarUrl: fileUrl } 
      });
    },
    onError: (error) => {
      console.error('Error uploading profile image:', error);
      toast.error('Error al subir la imagen de perfil');
    }
  });

  const {
    uploadImage: uploadCoverImage,
    isUploading: isUploadingCover,
    progress: coverProgress
  } = usePageImageUpload(page.id, 'cover', {
    onSuccess: (fileUrl) => {
      setCoverImage(fileUrl);
      // Update page with new cover image
      updatePage.mutate({ 
        pageId: page.id, 
        data: { coverImageUrl: fileUrl } 
      });
    },
    onError: (error) => {
      console.error('Error uploading cover image:', error);
      toast.error('Error al subir la imagen de portada');
    }
  });

  // Mutation for updating page
  const updatePage = useUpdatePage();

  const isUploading = isUploadingProfile || isUploadingCover;

  const handleImageUpload = async (
    file: File,
    type: 'profile' | 'cover'
  ) => {
    if (!file) return;

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    try {
      // Use the appropriate upload function
      if (type === 'profile') {
        await uploadProfileImage(file);
        toast.success('Imagen de perfil actualizada correctamente');
      } else {
        await uploadCoverImage(file);
        toast.success('Imagen de portada actualizada correctamente');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      // Error toast is already shown by the hook onError callback
    }
  };

  const handleRemoveImage = async (type: 'profile' | 'cover') => {
    try {
      if (type === 'profile') {
        setProfileImage(null);
        updatePage.mutate({ 
          pageId: page.id, 
          data: { avatarUrl: '' } 
        });
      } else {
        setCoverImage(null);
        updatePage.mutate({ 
          pageId: page.id, 
          data: { coverImageUrl: '' } 
        });
      }
      toast.success(`Imagen de ${type === 'profile' ? 'perfil' : 'portada'} eliminada`);
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Error al eliminar la imagen');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Apariencia
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Personaliza las imágenes de tu página
        </p>
      </div>

      {/* Cover Image Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white">
              Imagen de portada
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Recomendado: 1920x1080px • Máx: 5MB
            </p>
          </div>
          {coverImage && (
            <button
              onClick={() => handleRemoveImage('cover')}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
            >
              <XMarkIcon className="w-4 h-4" />
              Eliminar
            </button>
          )}
        </div>

        {/* Cover Preview */}
        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
          {coverImage ? (
            <Image
              src={coverImage}
              alt="Cover preview"
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Sin imagen de portada
                </p>
              </div>
            </div>
          )}
          
          {/* Upload Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Subiendo...' : 'Cambiar imagen'}
            </button>
          </div>
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file, 'cover');
          }}
        />
      </div>

      {/* Profile Image Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white">
              Imagen de perfil
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Recomendado: 400x400px • Máx: 5MB
            </p>
          </div>
          {profileImage && (
            <button
              onClick={() => handleRemoveImage('profile')}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
            >
              <XMarkIcon className="w-4 h-4" />
              Eliminar
            </button>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Profile Preview */}
          <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 group">
            {profileImage ? (
              <Image
                src={profileImage}
                alt="Profile preview"
                fill
                sizes="128px"
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <PhotoIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
            
            {/* Upload Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => profileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Subiendo...' : 'Cambiar'}
              </button>
            </div>
          </div>

          <div className="flex-1">
            <button
              onClick={() => profileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Subiendo...' : 'Subir imagen'}
            </button>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              JPG, PNG o GIF. Tamaño máximo de 5MB.
            </p>
          </div>
        </div>

        <input
          ref={profileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file, 'profile');
          }}
        />
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          💡 Consejos para mejores imágenes
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Usa imágenes de alta calidad que representen tu marca</li>
          <li>La imagen de portada debe ser horizontal (16:9 ideal)</li>
          <li>La imagen de perfil debe ser cuadrada y reconocible</li>
          <li>Evita texto pequeño que sea difícil de leer</li>
          <li>Mantén un estilo consistente con tu identidad visual</li>
        </ul>
      </div>
    </div>
  );
};
