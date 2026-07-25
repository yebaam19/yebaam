'use client';

import { FC, useMemo, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { PlayIcon, ShareIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { useFetch } from '@/lib/hooks/useFetch';
import { resolveImageRef } from '@/lib/media/urls';
import { postService } from '@/app/(app)/feed/post/services/post.service';
import { useUpdatePage } from '../../../hooks/usePages';
import type { Page } from '../../../types/page.types';
import { firstVideo, videoThumbnail } from '../pagevideos/videoHelpers';

interface PageFeaturedProps {
  page: Page;
  isOwner: boolean;
}

/**
 * "REEL O FOTO" del wireframe (pág. 13) = PDF §5 "Contenido Destacado".
 * El propietario fija un post con video/imagen o una imagen Cloudflare.
 */
export const PageFeatured: FC<PageFeaturedProps> = ({ page, isOwner }) => {
  const updatePage = useUpdatePage();
  const [picking, setPicking] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Picker con clave propia: comparte fetcher con el muro pero pide 50 en vez
  // de 20 — bajo la clave compartida 'page-posts' dos límites distintos se
  // pisarían entre sí (último fetch gana).
  const { data: posts } = useFetch(
    ['page-featured-picker', page.id],
    () => postService.getPagePosts(page.id, 50),
    { enabled: picking }
  );

  // El post fijado se resuelve por id: antes se buscaba en la primera página de
  // posts (20), así que destacar algo más antiguo dejaba el hero vacío.
  const inPicker = useMemo(
    () => (posts ?? []).find((p) => p.id === page.featuredPostId) ?? null,
    [posts, page.featuredPostId]
  );
  const { data: fetchedById } = useFetch(
    ['page-featured-post', page.featuredPostId],
    () => postService.getById(page.featuredPostId!),
    { enabled: Boolean(page.featuredPostId) && !inPicker, staleTime: 30000 }
  );
  const featuredPost = inPicker ?? fetchedById ?? null;

  const featuredImageSrc = page.featuredCfImageId
    ? resolveImageRef(page.featuredCfImageId, 'hero')
    : null;

  const video = featuredPost ? firstVideo(featuredPost) : null;
  const postImage =
    featuredPost?.mediaFiles?.find((m) => m.type?.toUpperCase() === 'IMAGE')?.url ?? null;
  const streamUid = video?.streamUid;
  const thumb = video ? videoThumbnail(video) : postImage;

  const hasContent = Boolean(streamUid || featuredImageSrc || postImage);

  const clearFeatured = async () => {
    try {
      await updatePage.mutateAsync({
        pageId: page.id,
        data: {
          featuredType: null,
          featuredPostId: null,
          featuredCfImageId: null,
          featuredAutoplay: false,
        },
      });
      toast.success('Contenido destacado eliminado');
      setPicking(false);
    } catch {
      toast.error('No se pudo quitar el destacado');
    }
  };

  const pickPost = async (postId: string) => {
    const post = (posts ?? []).find((p) => p.id === postId);
    if (!post) return;
    const hasVideo = firstVideo(post);
    const hasImage = post.mediaFiles?.some((m) => m.type?.toUpperCase() === 'IMAGE');
    const type = post.isReel ? 'reel' : hasVideo ? 'video' : hasImage ? 'image' : null;
    if (!type) {
      toast.error('Elige una publicación con imagen o video');
      return;
    }
    try {
      await updatePage.mutateAsync({
        pageId: page.id,
        data: {
          featuredType: type,
          featuredPostId: postId,
          featuredCfImageId: null,
          featuredAutoplay: type !== 'image',
        },
      });
      toast.success('Contenido destacado actualizado');
      setPicking(false);
    } catch {
      toast.error('No se pudo guardar el destacado');
    }
  };

  const handleShare = async () => {
    const { copyToClipboard } = await import('@/lib/clipboard');
    if (await copyToClipboard(window.location.href)) {
      toast.success('Enlace copiado');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="relative aspect-video w-full bg-gray-50 dark:bg-gray-900/40">
        {streamUid ? (
          <iframe
            title="Contenido destacado"
            src={`https://iframe.videodelivery.net/${streamUid}${page.featuredAutoplay ? '?autoplay=true&muted=true' : ''}`}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : featuredImageSrc || postImage ? (
          <Image
            src={(featuredImageSrc || postImage)!}
            alt="Contenido destacado"
            fill
            sizes="(min-width: 1024px) 700px, 100vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 dark:border-gray-700">
            <PlayIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            <div className="text-center px-6">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Contenido destacado
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 max-w-md">
                {isOwner
                  ? 'Fija aquí un reel, un video o una imagen de tus publicaciones.'
                  : 'Esta página todavía no ha destacado un reel, video o imagen.'}
              </p>
            </div>
          </div>
        )}

        {hasContent && (
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80"
            >
              Pantalla completa
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="rounded-lg bg-black/60 p-1.5 text-white hover:bg-black/80"
              title="Compartir"
            >
              <ShareIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isOwner && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 dark:border-gray-700 px-4 py-3">
          <button
            type="button"
            onClick={() => setPicking((v) => !v)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {picking ? 'Cerrar' : hasContent ? 'Cambiar destacado' : 'Elegir destacado'}
          </button>
          {hasContent && (
            <button
              type="button"
              onClick={clearFeatured}
              disabled={updatePage.isPending}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Quitar
            </button>
          )}
        </div>
      )}

      {picking && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-4 max-h-64 overflow-y-auto">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Elige una publicación con imagen o video:
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {(posts ?? [])
              .filter(
                (p) =>
                  firstVideo(p) ||
                  p.mediaFiles?.some((m) => m.type?.toUpperCase() === 'IMAGE')
              )
              .map((p) => {
                const v = firstVideo(p);
                const img =
                  (v ? videoThumbnail(v) : null) ||
                  p.mediaFiles?.find((m) => m.type?.toUpperCase() === 'IMAGE')?.url;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pickPost(p.id)}
                    className="relative aspect-square overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700"
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-full w-full object-cover" decoding="async" loading="lazy" />
                    ) : (
                      <PlayIcon className="absolute inset-0 m-auto h-6 w-6 text-white" />
                    )}
                  </button>
                );
              })}
          </div>
          {(posts ?? []).length === 0 && (
            <p className="text-sm text-gray-500">Aún no hay publicaciones para destacar.</p>
          )}
        </div>
      )}

      {fullscreen && hasContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-5xl aspect-video">
            {streamUid ? (
              <iframe
                title="Destacado pantalla completa"
                src={`https://iframe.videodelivery.net/${streamUid}?autoplay=true`}
                className="absolute inset-0 h-full w-full border-0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <Image
                src={(featuredImageSrc || postImage || thumb)!}
                alt=""
                fill
                className="object-contain"
                sizes="100vw"
                unoptimized
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
