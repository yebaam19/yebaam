'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { uploadService } from '@/lib/service/upload.service';
import { createCommunityArticle } from '@/features/communities/actions/communityArticles.actions';
import { PhotoIcon, XMarkIcon } from '@/components/icons/heroicons-shim';

const RichTextEditor = dynamic(
  () => import('@/features/article/components/RichTextEditor').then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    ),
  },
);

interface CommunityArticleComposerProps {
  communityId: string;
  communitySlug: string;
}

export function CommunityArticleComposer({ communityId, communitySlug }: CommunityArticleComposerProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverImageId, setCoverImageId] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCoverChange = async (file: File | null) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('La portada debe ser una imagen.');
      return;
    }
    setUploadingCover(true);
    setCoverPreview(URL.createObjectURL(file));
    try {
      const { id, url } = await uploadService.uploadImage(file);
      setCoverImageId(id);
      setCoverPreview(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error subiendo la portada.');
      setCoverPreview(null);
      setCoverImageId(null);
    } finally {
      setUploadingCover(false);
    }
  };

  const removeCover = () => {
    setCoverPreview(null);
    setCoverImageId(null);
  };

  const handleEditorImageUpload = async (file: File): Promise<string | null> => {
    try {
      const { url } = await uploadService.uploadImage(file);
      return url;
    } catch {
      return null;
    }
  };

  const handlePublish = () => {
    setError(null);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('El título es obligatorio.');
      return;
    }
    if (!content.trim() || content === '<p></p>') {
      setError('Escribe el contenido del artículo.');
      return;
    }
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    startTransition(async () => {
      const result = await createCommunityArticle({
        communityId,
        title: trimmedTitle,
        subtitle: subtitle.trim() || undefined,
        content,
        cfImageId: coverImageId ?? undefined,
        tags,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/feed/comunidades/${communitySlug}/articulos/${result.slug}` as Route);
    });
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo artículo</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending || uploadingCover}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </header>

      {error && (
        <p className="rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="rounded-lg bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        {coverPreview ? (
          <div className="relative aspect-[16/6] bg-gray-100 dark:bg-gray-900">
            <Image
              src={coverPreview}
              alt="Portada"
              fill
              sizes="100vw"
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={removeCover}
              className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
              aria-label="Quitar portada"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
            {uploadingCover && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
                Subiendo portada...
              </div>
            )}
          </div>
        ) : (
          <label className="flex aspect-[16/6] cursor-pointer items-center justify-center bg-gray-50 dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <div className="flex flex-col items-center gap-2">
              <PhotoIcon className="h-8 w-8" />
              <span>Añadir imagen de portada (opcional)</span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingCover}
              onChange={(e) => {
                void handleCoverChange(e.target.files?.[0] ?? null);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </section>

      <section className="rounded-lg bg-white dark:bg-gray-800 shadow-sm p-5 space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 160))}
          placeholder="Título del artículo"
          className="w-full border-0 bg-transparent text-2xl font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-0"
          maxLength={160}
        />
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value.slice(0, 240))}
          placeholder="Subtítulo (opcional)"
          className="w-full border-0 bg-transparent text-base text-gray-600 dark:text-gray-400 placeholder:text-gray-400 focus:outline-none focus:ring-0"
          maxLength={240}
        />
      </section>

      <section className="rounded-lg bg-white dark:bg-gray-800 shadow-sm p-5 space-y-4">
        <RichTextEditor
          content=""
          isHeaderMode
          onImageUpload={handleEditorImageUpload}
          onChange={() => {
            /* toolbar mode does not emit content */
          }}
        />
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Escribe tu artículo..."
          onImageUpload={handleEditorImageUpload}
        />
      </section>

      <section className="rounded-lg bg-white dark:bg-gray-800 shadow-sm p-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Etiquetas (separadas por coma)
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="música, coleccionismo, vinilo"
          className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </section>
    </div>
  );
}
