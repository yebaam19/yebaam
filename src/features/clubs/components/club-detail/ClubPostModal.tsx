'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { StreamVideo } from '@/components/media/StreamVideo';
import type { ClubPost, ClubPostKind } from '@/features/clubs/server/clubs.server';
import { toggleClubPostReactionAction } from '@/features/clubs/server/clubs.actions';
import {
  XMarkIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  FolderIcon,
} from '@/components/icons/heroicons-shim';

interface ClubPostModalProps {
  post: ClubPost;
  onClose: () => void;
}

const KIND_ICON: Record<ClubPostKind, typeof PhotoIcon> = {
  NOTE: ChatBubbleOvalLeftIcon,
  PHOTO: PhotoIcon,
  VIDEO: VideoCameraIcon,
  ARTICLE: DocumentTextIcon,
  FILE: FolderIcon,
};

const KIND_LABEL: Record<ClubPostKind, string> = {
  NOTE: 'Nota',
  PHOTO: 'Foto',
  VIDEO: 'Video',
  ARTICLE: 'Artículo',
  FILE: 'Archivo',
};

export function ClubPostModal({ post, onClose }: ClubPostModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [pending, startTransition] = useTransition();
  const [liked, setLiked] = useState(post.viewerReacted);
  const [count, setCount] = useState(post.reactionsCount);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    closeBtnRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleLike = () => {
    // Optimistic toggle — reconcile from the server result.
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    startTransition(async () => {
      const res = await toggleClubPostReactionAction(post.id);
      if (res.ok) {
        setLiked(res.data.liked);
        setCount(res.data.count);
      } else {
        // Revert on failure.
        setLiked(!nextLiked);
        setCount((c) => c + (nextLiked ? -1 : 1));
      }
    });
  };

  const KindIcon = KIND_ICON[post.kind];
  const author = post.author;
  const authorName =
    author?.displayName || author?.username || 'Miembro del club';
  const images = post.media.filter((m) => m.kind === 'image' && m.url);
  const videos = post.media.filter((m) => m.kind === 'video' && m.cfVideoUid);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={post.title || KIND_LABEL[post.kind]}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header: author + kind + close */}
        <header className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            {author?.avatarUrl ? (
              <Image
                src={author.avatarUrl}
                alt={authorName}
                fill
                sizes="36px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-300">
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {authorName}
            </div>
            <div className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <KindIcon className="h-3.5 w-3.5" /> {KIND_LABEL[post.kind]}
            </div>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {post.title && (
            <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
              {post.title}
            </h2>
          )}
          {post.body && (
            <p className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">
              {post.body}
            </p>
          )}

          {images.length > 0 && (
            <div className="mt-4 space-y-3">
              {images.map((m, idx) => (
                <div
                  key={`${m.url}-${idx}`}
                  className="relative aspect-16/9 w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
                >
                  <Image
                    src={m.url as string}
                    alt={post.title || 'Imagen de la publicación'}
                    fill
                    sizes="(max-width: 672px) 100vw, 672px"
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}

          {videos.length > 0 && (
            <div className="mt-4 space-y-3">
              {videos.map((m, idx) => (
                <StreamVideo
                  key={`${m.cfVideoUid}-${idx}`}
                  uid={m.cfVideoUid as string}
                  aspectRatio="16 / 9"
                  controls
                  className="overflow-hidden rounded-lg"
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer: counts + like */}
        <footer className="flex items-center gap-4 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
          <button
            type="button"
            onClick={handleLike}
            disabled={pending}
            aria-pressed={liked}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors disabled:opacity-60 ${
              liked
                ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <HeartIcon className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
            {count}
          </button>
          <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <ChatBubbleOvalLeftIcon className="h-4 w-4" /> {post.commentsCount}
          </span>
          <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <EyeIcon className="h-4 w-4" /> {post.views}
          </span>
        </footer>
      </div>
    </div>
  );
}
