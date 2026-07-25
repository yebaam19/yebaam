'use client';

/**
 * Multi-image upload control for the classified composer.
 *
 * One file input wired to `uploadService.uploadImage` per file picked,
 * with a per-image upload state so the user sees which image is mid-flight
 * vs. ready. The parent owns the canonical list of Cloudflare image ids;
 * this component only emits add/remove events.
 *
 * Hard caps at MAX_IMAGES to avoid runaway uploads — the rule of thumb is
 * the same as for posts (6 photos). Server validation is the ultimate
 * gate, but we trim client-side to keep the UX honest.
 */

import { useState, useCallback, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  PhotoIcon,
  PlusIcon,
  XMarkIcon,
} from '@/components/icons/heroicons-shim';
import { uploadService } from '@/lib/service/upload.service';

const MAX_IMAGES = 6;
const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? '';

function previewUrlForId(id: string): string | undefined {
  if (!CF_HASH) return undefined;
  return `https://imagedelivery.net/${CF_HASH}/${id}/public`;
}

interface ImageUploaderProps {
  cfImageIds: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export function ImageUploader({ cfImageIds, onChange, disabled }: ImageUploaderProps) {
  const t = useTranslations('cities.classifieds.composer');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_IMAGES - cfImageIds.length;

  const handlePick = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      e.target.value = ''; // reset so the same file can be re-picked
      if (files.length === 0) return;

      setError(null);
      setUploading(true);
      try {
        const slice = files.slice(0, Math.max(remaining, 0));
        const ids: string[] = [];
        for (const f of slice) {
          // Sequential uploads — sane default for a /api/upload/image-url
          // gateway that issues one direct-upload URL at a time.
          const { id } = await uploadService.uploadImage(f);
          ids.push(id);
        }
        onChange([...cfImageIds, ...ids]);
      } catch (err) {
        console.error('[ImageUploader] upload failed', err);
        setError(t('errors.uploadFailed'));
      } finally {
        setUploading(false);
      }
    },
    [cfImageIds, onChange, remaining, t],
  );

  const handleRemove = (id: string) => {
    onChange(cfImageIds.filter((x) => x !== id));
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {t('fields.imagesLabel')}
      </span>
      <span className="text-xs text-neutral-500 dark:text-neutral-400">
        {t('fields.imagesHint')}
      </span>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {cfImageIds.map((id) => {
          const url = previewUrlForId(id);
          return (
            <div
              key={id}
              className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900"
            >
              {url ? (
                <img src={url} alt="" className="h-full w-full object-cover" decoding="async" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-400">
                  <PhotoIcon className="h-6 w-6" />
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemove(id)}
                disabled={disabled || uploading}
                aria-label={t('actions.removeImage')}
                className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80 disabled:opacity-50"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {remaining > 0 && (
          <label
            className={
              disabled || uploading
                ? 'flex aspect-square cursor-not-allowed flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400 dark:border-neutral-600 dark:bg-neutral-900'
                : 'flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-500 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-primary-500 dark:hover:text-primary-400'
            }
          >
            <PlusIcon className="h-5 w-5" />
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePick}
              disabled={disabled || uploading}
            />
          </label>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
