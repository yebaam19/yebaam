'use client';

import { FC } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { PhotoIcon, PlayIcon, Squares2X2Icon } from '@/components/icons/heroicons-shim';
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces';
import { isVideoMedia } from '../pagevideos/videoHelpers';

interface PagePostsGridProps {
  posts: Post[];
}

/** Post permalink (page posts are authored by the owner's profile, like PostCard). */
function postHref(post: Post): Route {
  return `/${post.author.username}/posts/${post.id}` as Route;
}

/**
 * Vista Cuadrícula (PDF §6): mosaico de miniaturas de las publicaciones con
 * multimedia. Cada azulejo enlaza al permalink del post. Los posts sólo-texto
 * no aparecen aquí (no tienen miniatura) — para verlos se usa la vista Feed.
 * Componente presentacional puro: recibe `posts` ya resueltos (URLs de entrega
 * reconstruidas en normalizeMedia), no hace fetch.
 */
export const PagePostsGrid: FC<PagePostsGridProps> = ({ posts }) => {
  const withMedia = posts.filter((p) => (p.mediaFiles?.length ?? 0) > 0);

  if (withMedia.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 mb-3">
          <PhotoIcon className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Aún no hay fotos ni videos para mostrar en cuadrícula.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
      {withMedia.map((post) => {
        const media = post.mediaFiles[0];
        const isVideo = isVideoMedia(media);
        const thumb = media.thumbnailUrl || (isVideo ? undefined : media.url);
        const hasMultiple = post.mediaFiles.length > 1;

        return (
          <Link
            key={post.id}
            href={postHref(post)}
            className="group relative block aspect-square overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700"
            aria-label={post.content ? post.content.slice(0, 80) : 'Publicación'}
          >
            {thumb ? (
              <img
                src={thumb}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-800">
                <PlayIcon className="h-8 w-8 text-white/80" />
              </div>
            )}

            {isVideo && thumb && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/10">
                <span className="rounded-full bg-black/50 p-2">
                  <PlayIcon className="h-6 w-6 text-white" />
                </span>
              </span>
            )}

            {hasMultiple && (
              <span className="absolute right-1.5 top-1.5 rounded-md bg-black/55 p-1">
                <Squares2X2Icon className="h-4 w-4 text-white" />
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};
