import { FC, useState, useRef } from 'react';
import type { CreatePageDto } from '../../types/page.types';
import { pagesService } from '../../services/pages.service';
import { ImageUploadPreview } from './ImageUploadPreview';
import { UploadingIndicator } from './UploadingIndicator';
import { StepNavigationButtons } from './StepNavigationButtons';

interface CreatePageStep3Props {
  data: Partial<CreatePageDto>;
  onUpdate: (data: Partial<CreatePageDto>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const CreatePageStep3: FC<CreatePageStep3Props> = ({ data, onUpdate, onNext, onBack }) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(data.profileImageUrl || null);
  const [coverPreview, setCoverPreview] = useState<string | null>(data.coverImageUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Guardar el archivo para subirlo después
    setAvatarFile(file);

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Guardar el archivo para subirlo después
    setCoverFile(file);

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleRemoveCover = () => {
    setCoverPreview(null);
    setCoverFile(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  /**
   * Sube la imagen de perfil a S3 y retorna la URL de CloudFront
   */
  const uploadProfileImage = async (file: File): Promise<string> => {
    try {
      setUploadingAvatar(true);
      
      // 1. Obtener URL presignada
      const { uploadUrl, cloudFrontUrl } = await pagesService.generateProfileImageUploadUrl({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      // 2. Subir archivo a S3
      await pagesService.uploadImageToS3(uploadUrl, file);

      // 3. Retornar URL de CloudFront
      return cloudFrontUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw new Error('No se pudo subir la imagen de perfil');
    } finally {
      setUploadingAvatar(false);
    }
  };

  /**
   * Sube la imagen de portada a S3 y retorna la URL de CloudFront
   */
  const uploadCoverImage = async (file: File): Promise<string> => {
    try {
      setUploadingCover(true);
      
      // 1. Obtener URL presignada
      const { uploadUrl, cloudFrontUrl } = await pagesService.generateCoverImageUploadUrl({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      // 2. Subir archivo a S3
      await pagesService.uploadImageToS3(uploadUrl, file);

      // 3. Retornar URL de CloudFront
      return cloudFrontUrl;
    } catch (error) {
      console.error('Error uploading cover image:', error);
      throw new Error('No se pudo subir la imagen de portada');
    } finally {
      setUploadingCover(false);
    }
  };

  /**
   * Maneja la subida de ambas imágenes antes de continuar
   */
  const handleNext = async () => {
    try {
      const updates: Partial<CreatePageDto> = {};

      // Subir imagen de perfil si existe
      if (avatarFile) {
        updates.profileImageUrl = await uploadProfileImage(avatarFile);
      }

      // Subir imagen de portada si existe
      if (coverFile) {
        updates.coverImageUrl = await uploadCoverImage(coverFile);
      }

      // Actualizar formData con las URLs de CloudFront
      if (Object.keys(updates).length > 0) {
        onUpdate(updates);
      }

      // Continuar al siguiente paso
      onNext();
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(error instanceof Error ? error.message : 'Error al subir las imágenes. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Personaliza tu página
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Agrega imágenes para hacer tu página más atractiva (opcional pero recomendado)
        </p>
      </div>

      {/* Imagen de portada */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Imagen de portada
        </label>
        <ImageUploadPreview
          preview={coverPreview}
          onRemove={handleRemoveCover}
          onClick={() => coverInputRef.current?.click()}
          type="cover"
          isUploading={uploadingCover}
        />
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverSelect}
          className="hidden"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {uploadingCover ? 'Subiendo imagen...' : 'Las imágenes se subirán a CloudFront'}
        </p>
      </div>

      {/* Imagen de perfil */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Foto de perfil
        </label>
        <ImageUploadPreview
          preview={avatarPreview}
          onRemove={handleRemoveAvatar}
          onClick={() => avatarInputRef.current?.click()}
          type="profile"
          isUploading={uploadingAvatar}
        />
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarSelect}
          className="hidden"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">
          {uploadingAvatar ? 'Subiendo imagen...' : 'Las imágenes se subirán a CloudFront'}
        </p>
      </div>

      <UploadingIndicator
        uploadingAvatar={uploadingAvatar}
        uploadingCover={uploadingCover}
      />

      <StepNavigationButtons
        onBack={onBack}
        onNext={handleNext}
        isLoading={uploadingAvatar || uploadingCover}
      />
    </div>
  );
};
