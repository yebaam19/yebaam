'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowPathIcon, PhotoIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import { uploadService } from '@/lib/service/upload.service';

interface PetCoverFieldProps {
  value: string | null;
  onChange: (cfImageId: string | null) => void;
}

export function PetCoverField({ value, onChange }: PetCoverFieldProps) {
  const t = useTranslations('profile.pets');
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      const { id } = await uploadService.uploadImage(file, (p) => setProgress(p));
      onChange(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.uploadFailed'));
    } finally {
      setUploading(false);
    }
  }

  const preview = value ? imageUrl(value, 'public') : null;

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {t('fields.cover')}
      </label>
      <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
        {preview ? (
          <img src={preview} alt="" aria-hidden className="h-full w-full object-cover" decoding="async" loading="lazy" />
        ) : (
          <div className="text-center text-zinc-400">
            <PhotoIcon className="mx-auto h-10 w-10" />
            <p className="mt-1 text-xs">{t('coverEmpty')}</p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white">
            <ArrowPathIcon className="h-6 w-6 animate-spin" />
            <span className="text-xs">{t('uploading', { progress })}</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = '';
          }}
        />

        <div className="absolute inset-x-2 bottom-2 flex justify-between">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-800 shadow hover:bg-white hover:cursor-pointer disabled:opacity-50 dark:bg-zinc-900/80 dark:text-zinc-100"
          >
            {preview ? t('coverChange') : t('coverUpload')}
          </button>
          {preview && !uploading && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow hover:cursor-pointer dark:bg-zinc-900/80 dark:text-zinc-200"
              aria-label={t('coverRemove')}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
