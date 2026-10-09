'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { uploadService } from '@/lib/service/upload.service';
import { createCommunityPost } from '@/features/communities/actions/create.actions';
import { invalidate } from '@/lib/hooks/cacheStore';
import { PhotoIcon, VideoCameraIcon, XMarkIcon } from '@/components/icons/heroicons-shim';

interface CommunityPostComposerProps {
  communityId: string;
}

type PendingMedia =
  | { kind: 'image'; cfImageId: string; previewUrl: string }
  | { kind: 'video'; cfVideoUid: string; thumbnail?: string };

export function CommunityPostComposer({ communityId }: CommunityPostComposerProps) {
  const router = useRouter();
  const t = useTranslations('communities');
  const [body, setBody] = useState('');
  const [media, setMedia] = useState<PendingMedia[]>([]);
  const [uploading, setUploading] = useState<'image' | 'video' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (file.type.startsWith('image/')) {
      setUploading('image');
      try {
        const { id, url } = await uploadService.uploadImage(file);
        setMedia((prev) => [...prev, { kind: 'image', cfImageId: id, previewUrl: url }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error subiendo imagen');
      } finally {
        setUploading(null);
      }
      return;
    }
    if (file.type.startsWith('video/')) {
      setUploading('video');
      try {
        const { uid, thumbnail } = await uploadService.uploadVideo(file);
        setMedia((prev) => [...prev, { kind: 'video', cfVideoUid: uid, thumbnail }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error subiendo video');
      } finally {
        setUploading(null);
      }
      return;
    }
    setError('Tipo de archivo no soportado.');
  };

  const removeMedia = (idx: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!body.trim() && media.length === 0) {
      setError('Escribe algo o adjunta un archivo.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await createCommunityPost({
      communityId,
      body: body.trim(),
      media: media.map((m) =>
        m.kind === 'image'
          ? { kind: 'image' as const, cfImageId: m.cfImageId }
          : { kind: 'video' as const, cfVideoUid: m.cfVideoUid, thumbnail: m.thumbnail },
      ),
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBody('');
    setMedia([]);
    invalidate('communities::posts');
    invalidate('communities::detail');
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-3"
    >
      <textarea
        aria-label={t('detail.composerPlaceholder')}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={t('detail.composerPlaceholder')}
        className="w-full resize-none border-0 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-primary-800 dark:text-white dark:focus-visible:outline-primary-300"
      />

      {media.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {media.map((m, idx) => (
            <div key={idx} className="relative aspect-square overflow-hidden rounded-md bg-gray-100 dark:bg-gray-900">
              {m.kind === 'image' ? (
                <Image
                  src={m.previewUrl}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                  unoptimized
                />
              ) : m.thumbnail ? (
                <Image
                  src={m.thumbnail}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <VideoCameraIcon className="h-8 w-8" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeMedia(idx)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                aria-label="Quitar"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-md p-2 text-neutral-600 hover:bg-primary-50 focus-within:outline-2 focus-within:outline-primary-800 dark:text-neutral-300 dark:hover:bg-primary-950/40">
            <PhotoIcon className="h-5 w-5" />
            <span className="sr-only">{t('detail.addImage')}</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = '';
              }}
            />
          </label>
          <label className="cursor-pointer rounded-md p-2 text-neutral-600 hover:bg-primary-50 focus-within:outline-2 focus-within:outline-primary-800 dark:text-neutral-300 dark:hover:bg-primary-950/40">
            <VideoCameraIcon className="h-5 w-5" />
            <span className="sr-only">{t('detail.addVideo')}</span>
            <input
              type="file"
              accept="video/*"
              className="sr-only"
              disabled={uploading !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = '';
              }}
            />
          </label>
          {uploading && (
            <span className="text-xs text-gray-500">
              {uploading === 'image' ? t('detail.uploadingImage') : t('detail.uploadingVideo')}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting || uploading !== null}
          className="min-h-11 rounded-lg bg-[var(--community-primary)] px-4 py-2 text-sm font-medium text-white hover:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t('detail.composerSubmitting') : t('detail.composerSubmit')}
        </button>
      </div>
    </form>
  );
}
