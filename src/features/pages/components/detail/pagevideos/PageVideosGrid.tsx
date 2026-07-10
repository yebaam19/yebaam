'use client';

import { FC } from 'react';
import { PlayIcon } from '@/components/icons/heroicons-shim';
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces';
import { firstVideo, videoThumbnail, formatDuration } from './videoHelpers';

interface PageVideosGridProps {
  posts: Post[];
  onSelect: (post: Post) => void;
}

/**
 * Mosaico de miniaturas (PDF §4 "Videos"). Deliberadamente NO monta un reproductor
 * por azulejo: `PostVideoPlayer` incrusta un iframe de Cloudflare Stream, y N
 * iframes en una cuadrícula cuestan una petición y un contexto de render cada uno.
 * El reproductor se monta sólo en el lightbox, para el video elegido.
 */
export const PageVideosGrid: FC<PageVideosGridProps> = ({ posts, onSelect }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {posts.map((post) => {
      const video = firstVideo(post);
      if (!video) return null;

      const thumb = videoThumbnail(video);
      const duration = formatDuration(video.duration);
      const caption = post.content?.trim();

      return (
        <button
          key={post.id}
          type="button"
          onClick={() => onSelect(post)}
          className="group text-left rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="relative aspect-video bg-gray-900">
            {thumb ? (
              <img
                src={thumb}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
              />
            ) : (
              <div className="h-full w-full" />
            )}

            <span className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-black/55 p-3 transition-transform group-hover:scale-110">
                <PlayIcon className="h-6 w-6 text-white" />
              </span>
            </span>

            {duration && (
              <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                {duration}
              </span>
            )}
          </div>

          <div className="p-3">
            <p className="line-clamp-2 text-sm text-gray-800 dark:text-gray-200">
              {caption || 'Video sin descripción'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {new Date(post.createdAt).toLocaleDateString('es', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </button>
      );
    })}
  </div>
);
