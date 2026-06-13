'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { PhotoIcon } from '@/components/icons/heroicons-shim';

interface CommunityImagesStepProps {
  coverPreview: string | null;
  profilePreview: string | null;
  isUploadingCover: boolean;
  isUploadingProfile: boolean;
  onPick: (file: File, target: 'cover' | 'profile') => void;
}

export function CommunityImagesStep({
  coverPreview,
  profilePreview,
  isUploadingCover,
  isUploadingProfile,
  onPick,
}: CommunityImagesStepProps) {
  const t = useTranslations('communities');

  return (
    <>
      {/* Cover */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('create.fields.coverImage')}
        </label>
        <div className="relative h-32 w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800">
          {coverPreview ? (
            <Image
              src={coverPreview}
              alt={t('create.imageAltCover')}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
              <PhotoIcon className="h-8 w-8" />
              <span className="text-xs mt-1">
                {isUploadingCover ? t('create.uploading') : t('create.uploadHint')}
              </span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            disabled={isUploadingCover}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPick(file, 'cover');
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </div>
      </div>

      {/* Profile */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('create.fields.profileImage')}
        </label>
        <div className="relative h-20 w-20 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800">
          {profilePreview ? (
            <Image
              src={profilePreview}
              alt={t('create.imageAltProfile')}
              fill
              sizes="80px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <PhotoIcon className="h-6 w-6" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            disabled={isUploadingProfile}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPick(file, 'profile');
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </div>
      </div>
    </>
  );
}
