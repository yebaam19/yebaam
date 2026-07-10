'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useFetch } from '@/lib/hooks/useFetch';
import { getAxiosInstance } from '@/lib/http/legacy-client';
import { invalidate } from '@/lib/hooks/cacheStore';
import { postService } from '@/app/(app)/feed/post/services/post.service';
import { PlusIcon, TrashIcon, VideoCameraIcon } from '@/components/icons/heroicons-shim';
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces';
import { PageVideosGrid } from './pagevideos/PageVideosGrid';
import { PageVideoLightbox } from './pagevideos/PageVideoLightbox';
import { firstVideo } from './pagevideos/videoHelpers';

interface PageDetailVideosProps {
  pageId: string;
  isOwner?: boolean;
}

interface VideoEmbed {
  id: string;
  provider: 'youtube' | 'vimeo';
  title: string | null;
  iframeSrc: string;
  thumbnailUrl: string | null;
  url: string;
}

/**
 * Pestaña "Videos" (PDF §4): producciones propias (Cloudflare Stream) + embeds
 * YouTube/Vimeo vía `page_video_embeds` (iframe oficial, nunca descarga nativa).
 */
export const PageDetailVideos: FC<PageDetailVideosProps> = ({ pageId, isOwner = false }) => {
  const [selected, setSelected] = useState<Post | null>(null);
  const [embedOpen, setEmbedOpen] = useState<VideoEmbed | null>(null);
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useFetch(
    ['page-posts', pageId],
    () => postService.getPagePosts(pageId),
    { enabled: !!pageId }
  );

  const { data: embeds, isLoading: embedsLoading } = useFetch(
    ['page-video-embeds', pageId],
    async () => {
      const axios = getAxiosInstance();
      const { data: res } = await axios.get<VideoEmbed[]>(`/api/pages/${pageId}/video-embeds`);
      return res;
    },
    { enabled: !!pageId }
  );

  const videos = useMemo(
    () => (data ?? []).filter((post) => firstVideo(post) !== null),
    [data]
  );

  const closeLightbox = useCallback(() => setSelected(null), []);

  const handleAddEmbed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSaving(true);
    try {
      const axios = getAxiosInstance();
      await axios.post(`/api/pages/${pageId}/video-embeds`, {
        url: url.trim(),
        title: title.trim() || null,
      });
      invalidate('page-video-embeds');
      setUrl('');
      setTitle('');
      setAdding(false);
      toast.success('Video externo agregado');
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No se pudo agregar el video';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmbed = async (id: string) => {
    try {
      const axios = getAxiosInstance();
      await axios.delete(`/api/pages/${pageId}/video-embeds`, { params: { id } });
      invalidate('page-video-embeds');
      toast.success('Embed eliminado');
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  const total = videos.length + (embeds?.length ?? 0);
  const loading = isLoading || embedsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <VideoCameraIcon className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Videos</h3>
          {!loading && (
            <span className="text-sm text-gray-500 dark:text-gray-400">({total})</span>
          )}
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            YouTube / Vimeo
          </button>
        )}
      </div>

      {adding && (
        <form
          onSubmit={handleAddEmbed}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-3"
        >
          <input
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=… o https://vimeo.com/…"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título (opcional)"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Agregar embed'}
          </button>
        </form>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="aspect-video rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && total === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 mb-3">
            <VideoCameraIcon className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isOwner
              ? 'Aún no hay videos. Sube uno desde el muro o agrega un enlace de YouTube/Vimeo.'
              : 'Esta página todavía no ha publicado videos.'}
          </p>
        </div>
      )}

      {!loading && videos.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Producciones propias</h4>
          <PageVideosGrid posts={videos} onSelect={setSelected} />
        </div>
      )}

      {!loading && (embeds?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">YouTube / Vimeo</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {embeds!.map((emb) => (
              <div key={emb.id} className="relative group">
                <button
                  type="button"
                  onClick={() => setEmbedOpen(emb)}
                  className="block w-full aspect-video overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700"
                >
                  {emb.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={emb.thumbnailUrl}
                      alt={emb.title || emb.provider}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      {emb.provider}
                    </div>
                  )}
                </button>
                {emb.title && (
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                    {emb.title}
                  </p>
                )}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleDeleteEmbed(emb.id)}
                    className="absolute top-2 right-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 group-hover:opacity-100"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <PageVideoLightbox post={selected} onClose={closeLightbox} />

      {embedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            onClick={() => setEmbedOpen(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white"
          >
            Cerrar
          </button>
          <div className="relative w-full max-w-4xl aspect-video">
            <iframe
              title={embedOpen.title || 'Video'}
              src={embedOpen.iframeSrc}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};
