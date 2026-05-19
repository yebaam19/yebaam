'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowPathIcon, VideoCameraIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { streamThumb } from '@/lib/media/urls';
import { uploadService } from '@/lib/service/upload.service';
import type { PetVideoRow } from '@/features/pets/types/pet.types';

interface PetVideoUploaderProps {
  videos: PetVideoRow[];
  onAdd: (streamUid: string, thumbnail?: string | null) => void | Promise<void>;
  onRemove: (videoId: string) => void | Promise<void>;
}

export function PetVideoUploader({ videos, onAdd, onRemove }: PetVideoUploaderProps) {
  const t = useTranslations('profile.pets');
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [transcoding, setTranscoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setProgress(0);
    setTranscoding(false);
    try {
      const { uid } = await uploadService.uploadVideo(file, {
        onProgress: (p) => setProgress(p),
        onTranscode: () => setTranscoding(true),
      });
      await onAdd(uid, null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.uploadFailed'));
    } finally {
      setProgress(null);
      setTranscoding(false);
    }
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {t('videosHeading', { count: videos.length })}
        </h3>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 hover:cursor-pointer disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <VideoCameraIcon className="h-4 w-4" />
          {t('addVideo')}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = '';
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {videos.map((v) => (
          <div
            key={v.id}
            className="group relative aspect-video overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
          >
            <img
              src={streamThumb(v.cf_stream_uid, { width: 480 })}
              alt={v.caption ?? ''}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(v.id)}
              className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:cursor-pointer focus:opacity-100"
              aria-label={t('removeVideo')}
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {progress !== null && (
          <div className="flex aspect-video flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 text-zinc-500 dark:border-zinc-700">
            <ArrowPathIcon className="h-6 w-6 animate-spin" />
            <span className="text-[10px]">
              {transcoding ? t('videoTranscoding') : t('uploading', { progress })}
            </span>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </section>
  );
}
