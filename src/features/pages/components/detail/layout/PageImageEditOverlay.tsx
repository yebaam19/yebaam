'use client';

import { FC, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { usePageImageUpload } from '../../../hooks/usePageImageUpload';
import { useUpdatePage } from '../../../hooks/usePages';

interface PageImageEditOverlayProps {
  pageId: string;
  type: 'profile' | 'cover';
  onUploaded: (url: string) => void;
  label?: string;
}

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Botón de cambio de imagen (PDF §1.1 portada, §1.2 foto de perfil) para el
 * propietario en la vista pública. Reutiliza el mismo flujo que Apariencia en
 * ajustes: sube a Cloudflare y persiste el id en la página.
 */
export const PageImageEditOverlay: FC<PageImageEditOverlayProps> = ({
  pageId,
  type,
  onUploaded,
  label,
}) => {
  const t = useTranslations('pages.settings.appearance');
  const inputRef = useRef<HTMLInputElement>(null);
  const updatePage = useUpdatePage();

  const { uploadImage, isUploading } = usePageImageUpload(pageId, type === 'profile' ? 'avatar' : 'cover', {
    onSuccess: ({ id, url }) => {
      updatePage.mutate({
        pageId,
        data: type === 'profile' ? { profileImageUrl: id } : { coverImageUrl: id },
      });
      onUploaded(url);
      toast.success(type === 'profile' ? t('success.profileUpdated') : t('success.coverUpdated'));
    },
    onError: () => {
      toast.error(type === 'profile' ? t('errors.uploadProfile') : t('errors.uploadCover'));
    },
  });

  const handleFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error(t('errors.tooLarge'));
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error(t('errors.invalidType'));
      return;
    }
    await uploadImage(file);
  };

  return (
    <>
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="rounded-lg bg-white/95 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-white disabled:opacity-50 dark:bg-gray-800/95 dark:text-white"
        >
          {isUploading ? t('uploading') : label ?? t('changeImage')}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
    </>
  );
};
