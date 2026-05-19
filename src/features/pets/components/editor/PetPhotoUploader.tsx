'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowPathIcon, PhotoIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import { uploadService } from '@/lib/service/upload.service';
import type { PetPhotoRow } from '@/features/pets/types/pet.types';

interface PetPhotoUploaderProps {
  photos: PetPhotoRow[];
  onAdd: (cfImageId: string) => void | Promise<void>;
  onRemove: (photoId: string) => void | Promise<void>;
}

export function PetPhotoUploader({ photos, onAdd, onRemove }: PetPhotoUploaderProps) {
  const t = useTranslations('profile.pets');
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setError(null);
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) return;
    setUploadingCount(list.length);
    try {
      for (const f of list) {
        const { id } = await uploadService.uploadImage(f);
        await onAdd(id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.uploadFailed'));
    } finally {
      setUploadingCount(0);
    }
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {t('photosHeading', { count: photos.length })}
        </h3>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploadingCount > 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 hover:cursor-pointer disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <PhotoIcon className="h-4 w-4" />
          {t('addPhotos')}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((ph) => (
          <div
            key={ph.id}
            className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
          >
            <img
              src={imageUrl(ph.cf_image_id, 'public')}
              alt={ph.caption ?? ''}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(ph.id)}
              className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:cursor-pointer focus:opacity-100"
              aria-label={t('removePhoto')}
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {uploadingCount > 0 && (
          <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-zinc-300 text-zinc-500 dark:border-zinc-700">
            <ArrowPathIcon className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </section>
  );
}
