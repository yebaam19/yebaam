'use client';

import { useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { PhotoIcon } from '@/components/icons/heroicons-shim';
import { uploadService } from '@/lib/service/upload.service';

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? '';

function previewUrlForId(id: string): string | undefined {
  if (!CF_HASH) return undefined;
  return `https://imagedelivery.net/${CF_HASH}/${id}/public`;
}

interface Props {
  label: string;
  hint?: string;
  /** Empty-state prompt inside the drop target. */
  pickText: string;
  /** Overlay label once an image is set. */
  changeText: string;
  value: string | null;
  onChange: (cfImageId: string | null) => void;
  /** `wide` = 16/9 drop target (hero); `square` = compact square (owner photo). */
  shape?: 'wide' | 'square';
  disabled?: boolean;
}

/** One-image Cloudflare upload slot (hero photo / entrepreneur photo). */
export function SingleImageField({
  label,
  hint,
  pickText,
  changeText,
  value,
  onChange,
  shape = 'wide',
  disabled,
}: Props) {
  const t = useTranslations('cities.emprendimientos.composer');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);

  const handlePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(false);
    setUploading(true);
    try {
      const { id } = await uploadService.uploadImage(file);
      onChange(id);
    } catch (err) {
      console.error('[SingleImageField] upload failed', err);
      setError(true);
    } finally {
      setUploading(false);
    }
  };

  const url = value ? previewUrlForId(value) : undefined;
  const frame =
    shape === 'wide' ? 'aspect-[16/9] w-full' : 'aspect-square w-32';

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
        {label}
      </span>
      {hint && <span className="text-sm text-neutral-500 dark:text-neutral-400">{hint}</span>}
      <label
        className={`group relative block cursor-pointer overflow-hidden rounded-2xl ${frame} ${
          url
            ? 'border border-neutral-200 dark:border-neutral-700'
            : 'border-2 border-dashed border-neutral-300 bg-neutral-50 transition-colors hover:border-primary-400 dark:border-neutral-600 dark:bg-neutral-900 dark:hover:border-primary-500'
        } ${disabled || uploading ? 'pointer-events-none opacity-70' : ''}`}
      >
        {url ? (
          <>
            <img src={url} alt="" className="h-full w-full object-cover" />
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white">
              {changeText}
            </span>
          </>
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-neutral-500 transition-colors group-hover:text-primary-600 dark:text-neutral-400">
            <PhotoIcon className="h-8 w-8" />
            {pickText}
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePick}
          disabled={disabled || uploading}
        />
      </label>
      {error && (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          {t('errors.uploadFailed')}
        </p>
      )}
    </div>
  );
}
