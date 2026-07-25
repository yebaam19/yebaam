'use client';

import { FC, useState, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { PhotoIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { Page } from '../../types/page.types';
import { usePageImageUpload } from '../../hooks/usePageImageUpload';
import { useUpdatePage } from '../../hooks/usePages';
import { resolveImageRef } from '@/lib/media/urls';
import { toast } from 'sonner';

interface SettingsAppearanceProps {
  page: Page;
}

export const SettingsAppearance: FC<SettingsAppearanceProps> = ({ page }) => {
  const t = useTranslations('pages.settings.appearance');
  // id-first: la DB guarda el id de Cloudflare desnudo; la URL de entrega se
  // reconstruye al renderizar (resolveImageRef tolera URLs completas legadas).
  const [profileImage, setProfileImage] = useState<string | null>(
    resolveImageRef(page.profileImageUrl, 'avatar')
  );
  const [coverImage, setCoverImage] = useState<string | null>(
    resolveImageRef(page.coverImageUrl, 'cover')
  );

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Hooks for image upload
  const {
    uploadImage: uploadProfileImage,
    isUploading: isUploadingProfile,
    progress: profileProgress
  } = usePageImageUpload(page.id, 'avatar', {
    onSuccess: ({ id, url }) => {
      setProfileImage(url);
      // id-first: se persiste el id desnudo, no la URL de entrega.
      updatePage.mutate({
        pageId: page.id,
        data: { profileImageUrl: id }
      });
    },
    onError: (error) => {
      console.error('Error uploading profile image:', error);
      toast.error(t('errors.uploadProfile'));
    }
  });

  const {
    uploadImage: uploadCoverImage,
    isUploading: isUploadingCover,
    progress: coverProgress
  } = usePageImageUpload(page.id, 'cover', {
    onSuccess: ({ id, url }) => {
      setCoverImage(url);
      // id-first: se persiste el id desnudo, no la URL de entrega.
      updatePage.mutate({
        pageId: page.id,
        data: { coverImageUrl: id }
      });
    },
    onError: (error) => {
      console.error('Error uploading cover image:', error);
      toast.error(t('errors.uploadCover'));
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
      toast.error(t('errors.tooLarge'));
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error(t('errors.invalidType'));
      return;
    }

    try {
      // Use the appropriate upload function
      if (type === 'profile') {
        await uploadProfileImage(file);
        toast.success(t('success.profileUpdated'));
      } else {
        await uploadCoverImage(file);
        toast.success(t('success.coverUpdated'));
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
          data: { profileImageUrl: null }
        });
      } else {
        setCoverImage(null);
        updatePage.mutate({
          pageId: page.id,
          data: { coverImageUrl: null }
        });
      }
      toast.success(type === 'profile' ? t('success.profileRemoved') : t('success.coverRemoved'));
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error(t('errors.removeError'));
    }
  };

  const tips = t.raw('tips') as string[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('heading')}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('subheading')}
        </p>
      </div>

      {/* Cover Image Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white">
              {t('coverHeading')}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('coverHint')}
            </p>
          </div>
          {coverImage && (
            <button
              onClick={() => handleRemoveImage('cover')}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
            >
              <XMarkIcon className="w-4 h-4" />
              {t('remove')}
            </button>
          )}
        </div>

        {/* Cover Preview */}
        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={t('coverAlt')}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('noCover')}
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
              {isUploading ? t('uploading') : t('changeImage')}
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
              {t('profileHeading')}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('profileHint')}
            </p>
          </div>
          {profileImage && (
            <button
              onClick={() => handleRemoveImage('profile')}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
            >
              <XMarkIcon className="w-4 h-4" />
              {t('remove')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Profile Preview */}
          <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 group">
            {profileImage ? (
              <Image
                src={profileImage}
                alt={t('profileAlt')}
                fill
                sizes="128px"
                className="object-cover"
                unoptimized
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
                {isUploading ? t('uploading') : t('change')}
              </button>
            </div>
          </div>

          <div className="flex-1">
            <button
              onClick={() => profileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isUploading ? t('uploading') : t('uploadImage')}
            </button>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t('fileHint')}
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
          {t('tipsTitle')}
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
          {tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
