'use client';

import { FC, useEffect } from 'react';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import PostVideoPlayer from '@/app/(app)/feed/post/components/PostVideoPlayer';
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces';
import { firstVideo } from './videoHelpers';

interface PageVideoLightboxProps {
  post: Post | null;
  onClose: () => void;
}

/** Reproductor a pantalla completa. Es el ÚNICO sitio donde se monta un iframe de Stream. */
export const PageVideoLightbox: FC<PageVideoLightboxProps> = ({ post, onClose }) => {
  useEffect(() => {
    if (!post) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [post, onClose]);

  if (!post) return null;

  const video = firstVideo(post);
  if (!video) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reproductor de video"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-lg bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-3">
          <p className="line-clamp-2 text-sm text-gray-200">
            {post.content?.trim() || 'Video'}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 rounded p-1 text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <PostVideoPlayer video={video} />
      </div>
    </div>
  );
};
