'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { ClubPost, ClubPostKind } from '@/features/clubs/server/clubs.server';
import {
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  FolderIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/icons/heroicons-shim';

const KIND_ICON: Record<ClubPostKind, typeof PhotoIcon> = {
  NOTE: ChatBubbleOvalLeftIcon,
  PHOTO: PhotoIcon,
  VIDEO: VideoCameraIcon,
  ARTICLE: DocumentTextIcon,
  FILE: FolderIcon,
};

export type ViewMode = 'cascade' | 'paginated';

interface ClubPostsGridProps {
  posts: ClubPost[];
  filterKind?: ClubPostKind;
  viewMode: ViewMode;
  onOpen?: (postId: string) => void;
}

const PAGE_SIZE = 12;

export function ClubPostsGrid({ posts, filterKind, viewMode, onOpen }: ClubPostsGridProps) {
  const [page, setPage] = useState(0);

  const filtered = useMemo(
    () => (filterKind ? posts.filter((p) => p.kind === filterKind) : posts),
    [posts, filterKind],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible =
    viewMode === 'paginated'
      ? filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
      : filtered;

  if (!filtered.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aún no hay publicaciones en este apartado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {visible.map((post) => {
          const Icon = KIND_ICON[post.kind];
          return (
            <button
              key={post.id}
              onClick={() => onOpen?.(post.id)}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="relative aspect-square w-full bg-gray-100 dark:bg-gray-700">
                {post.thumbnailUrl || post.mediaUrl ? (
                  <Image
                    src={post.thumbnailUrl || post.mediaUrl || ''}
                    alt={post.title ?? 'post'}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                    <Icon className="h-10 w-10" />
                  </div>
                )}
                <span className="absolute top-2 right-2 rounded bg-black/60 p-1 text-white">
                  <Icon className="h-3 w-3" />
                </span>
              </div>
              <div className="flex flex-col gap-1 p-2">
                {post.title && (
                  <div className="line-clamp-1 text-sm font-medium text-gray-900 dark:text-white">
                    {post.title}
                  </div>
                )}
                <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <HeartIcon className="h-3 w-3" /> {post.reactionsCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ChatBubbleOvalLeftIcon className="h-3 w-3" /> {post.commentsCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <EyeIcon className="h-3 w-3" /> {post.views}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {viewMode === 'paginated' && pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600"
          >
            <ChevronLeftIcon className="h-4 w-4" /> Anterior
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {page + 1} / {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600"
          >
            Siguiente <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
