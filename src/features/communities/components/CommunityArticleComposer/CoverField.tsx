import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { PhotoIcon, XMarkIcon } from '@/components/icons/heroicons-shim';

interface CoverFieldProps {
  coverPreview: string | null;
  uploadingCover: boolean;
  onCoverChange: (file: File | null) => void;
  onRemoveCover: () => void;
}

export function CoverField({
  coverPreview,
  uploadingCover,
  onCoverChange,
  onRemoveCover,
}: CoverFieldProps) {
  const t = useTranslations('communities');

  return (
    <section className="rounded-lg bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
      {coverPreview ? (
        <div className="relative aspect-[16/6] bg-gray-100 dark:bg-gray-900">
          <Image
            src={coverPreview}
            alt={t('admin.article.composer.coverAlt')}
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
          <button
            type="button"
            onClick={onRemoveCover}
            className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            aria-label={t('admin.article.composer.removeCoverAria')}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
          {uploadingCover && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
              {t('admin.article.composer.uploadingCover')}
            </div>
          )}
        </div>
      ) : (
        <label className="flex aspect-[16/6] cursor-pointer items-center justify-center bg-gray-50 dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <div className="flex flex-col items-center gap-2">
            <PhotoIcon className="h-8 w-8" />
            <span>{t('admin.article.composer.addCover')}</span>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploadingCover}
            onChange={(e) => {
              onCoverChange(e.target.files?.[0] ?? null);
              e.target.value = '';
            }}
          />
        </label>
      )}
    </section>
  );
}
