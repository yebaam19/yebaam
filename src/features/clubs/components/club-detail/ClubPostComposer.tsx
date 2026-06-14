'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { uploadService } from '@/lib/service/upload.service';
import { createClubPostAction } from '@/features/clubs/server/clubs.actions';
import { PhotoIcon, VideoCameraIcon } from '@/components/icons/heroicons-shim';
import { MediaPreviewGrid, type PendingMedia } from './composer/MediaPreviewGrid';

interface ClubPostComposerProps {
  clubId: string;
}

export function ClubPostComposer({ clubId }: ClubPostComposerProps) {
  const router = useRouter();
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
    const result = await createClubPostAction({
      clubId,
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
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3 dark:border-gray-700 dark:bg-gray-800"
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Comparte algo con el club…"
        className="w-full resize-none border-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 dark:text-white"
      />

      <MediaPreviewGrid media={media} onRemove={removeMedia} />

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <PhotoIcon className="h-5 w-5" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = '';
              }}
            />
          </label>
          <label className="cursor-pointer rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <VideoCameraIcon className="h-5 w-5" />
            <input
              type="file"
              accept="video/*"
              className="hidden"
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
              {uploading === 'image' ? 'Subiendo imagen...' : 'Subiendo video...'}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting || uploading !== null}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </form>
  );
}
