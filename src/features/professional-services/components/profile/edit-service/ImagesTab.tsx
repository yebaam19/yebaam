'use client';

import { useTranslations } from 'next-intl';
import { ImageUploader } from '../ImageUploader';
import type { UseEditServiceForm } from './useEditServiceForm';

interface Props {
  images: UseEditServiceForm['images'];
  uploads: UseEditServiceForm['uploads'];
}

export function ImagesTab({ images, uploads }: Props) {
  const t = useTranslations('professional.services.editModal');
  return (
    <div className="space-y-6 py-4">
      <h3 className="text-lg font-medium">{t('images.heading')}</h3>

      <ImageUploader
        label={t('images.coverLabel')}
        currentImageUrl={images.coverUrl || undefined}
        onImageSelect={images.onCoverSelect}
        onUrlChange={images.onCoverUrlChange}
        isUploading={uploads.cover.isUploading}
        progress={uploads.cover.progress}
        error={uploads.cover.error}
        aspectRatio="cover"
      />

      <ImageUploader
        label={t('images.logoLabel')}
        currentImageUrl={images.logoUrl || undefined}
        onImageSelect={images.onLogoSelect}
        onUrlChange={images.onLogoUrlChange}
        isUploading={uploads.logo.isUploading}
        progress={uploads.logo.progress}
        error={uploads.logo.error}
        aspectRatio="square"
      />
    </div>
  );
}
