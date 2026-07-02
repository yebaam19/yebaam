'use client';

import { useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  PlusIcon,
  VideoCameraIcon,
  XMarkIcon,
} from '@/components/icons/heroicons-shim';
import { uploadService } from '@/lib/service/upload.service';
import { streamThumb } from '@/lib/media/urls';

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? '';
const MAX_SLOTS = 3;

export interface MediaDraft {
  type: 'IMAGE' | 'VIDEO';
  cfImageId?: string | null;
  cfStreamUid?: string | null;
}

function draftThumb(item: MediaDraft): string | undefined {
  if (item.type === 'IMAGE' && item.cfImageId && CF_HASH) {
    return `https://imagedelivery.net/${CF_HASH}/${item.cfImageId}/public`;
  }
  if (item.type === 'VIDEO' && item.cfStreamUid) {
    return streamThumb(item.cfStreamUid, { time: 1 });
  }
  return undefined;
}

interface Props {
  items: MediaDraft[];
  onChange: (next: MediaDraft[]) => void;
  disabled?: boolean;
}

/** The mockup's 3 "Foto o Video" slots. Images → CF Images, videos → Stream. */
export function MediaSlots({ items, onChange, disabled }: Props) {
  const t = useTranslations('cities.emprendimientos.composer');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);

  const handlePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || items.length >= MAX_SLOTS) return;
    setError(false);
    setUploading(true);
    try {
      if (file.type.startsWith('video/')) {
        const { uid } = await uploadService.uploadVideo(file);
        onChange([...items, { type: 'VIDEO', cfStreamUid: uid }]);
      } else {
        const { id } = await uploadService.uploadImage(file);
        onChange([...items, { type: 'IMAGE', cfImageId: id }]);
      }
    } catch (err) {
      console.error('[MediaSlots] upload failed', err);
      setError(true);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
        {t('fields.mediaLabel')}
      </span>
      <span className="text-sm text-neutral-500 dark:text-neutral-400">
        {t('fields.mediaHint')}
      </span>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item, index) => {
          const url = draftThumb(item);
          return (
            <div
              key={`${item.cfImageId ?? item.cfStreamUid}-${index}`}
              className="relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900"
            >
              {url && <img src={url} alt="" className="h-full w-full object-cover" />}
              {item.type === 'VIDEO' && (
                <span className="absolute bottom-1 left-1 rounded-full bg-black/60 p-1 text-white">
                  <VideoCameraIcon className="h-3.5 w-3.5" />
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled || uploading}
                aria-label={t('actions.removeMedia')}
                className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80 disabled:opacity-50"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {items.length < MAX_SLOTS && (
          <label
            className={
              disabled || uploading
                ? 'relative flex aspect-square cursor-not-allowed flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400 dark:border-neutral-600 dark:bg-neutral-900'
                : 'relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-500 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-primary-500 dark:hover:text-primary-400'
            }
          >
            {uploading ? (
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            ) : (
              <PlusIcon className="h-5 w-5" />
            )}
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handlePick}
              disabled={disabled || uploading}
            />
          </label>
        )}
      </div>
      {error && (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          {t('errors.uploadFailed')}
        </p>
      )}
    </div>
  );
}
