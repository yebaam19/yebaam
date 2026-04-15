'use client';

import Image from 'next/image';
import type { ClubPost } from '@/features/clubs/server/clubs.server';
import {
  ClockIcon,
  EyeIcon,
  HeartIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  FolderIcon,
} from '@/components/icons/heroicons-shim';

interface ClubHighlightedPostsProps {
  highlights: {
    mostRecent: ClubPost | null;
    mostViewed: ClubPost | null;
    mostReacted: ClubPost | null;
  };
  onOpen?: (postId: string) => void;
}

const KIND_ICON = {
  PHOTO: PhotoIcon,
  VIDEO: VideoCameraIcon,
  ARTICLE: DocumentTextIcon,
  FILE: FolderIcon,
};

function Card({
  title,
  subtitle,
  icon: TitleIcon,
  post,
  onOpen,
}: {
  title: string;
  subtitle: string;
  icon: typeof ClockIcon;
  post: ClubPost | null;
  onOpen?: (id: string) => void;
}) {
  if (!post) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center dark:border-gray-700">
        <TitleIcon className="mx-auto h-5 w-5 text-gray-400" />
        <div className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">{title}</div>
        <div className="text-xs text-gray-400">Sin publicaciones</div>
      </div>
    );
  }
  const KindIcon = KIND_ICON[post.kind];
  return (
    <button
      onClick={() => onOpen?.(post.id)}
      className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-700">
        {post.thumbnailUrl || post.mediaUrl ? (
          <Image
            src={post.thumbnailUrl || post.mediaUrl || ''}
            alt={post.title ?? title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <KindIcon className="h-10 w-10" />
          </div>
        )}
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
          <KindIcon className="h-3 w-3" /> {post.kind}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
          <TitleIcon className="h-3.5 w-3.5" /> {title}
        </div>
        <div className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
          {post.title || post.body || 'Sin título'}
        </div>
        <div className="mt-auto flex items-center gap-3 pt-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1">
            <EyeIcon className="h-3.5 w-3.5" /> {post.views}
          </span>
          <span className="inline-flex items-center gap-1">
            <HeartIcon className="h-3.5 w-3.5" /> {post.reactionsCount}
          </span>
        </div>
      </div>
    </button>
  );
}

export function ClubHighlightedPosts({ highlights, onOpen }: ClubHighlightedPostsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card
        title="Más reciente"
        subtitle="Última publicación"
        icon={ClockIcon}
        post={highlights.mostRecent}
        onOpen={onOpen}
      />
      <Card
        title="Más vista"
        subtitle="Mayor alcance"
        icon={EyeIcon}
        post={highlights.mostViewed}
        onOpen={onOpen}
      />
      <Card
        title="Más reaccionada"
        subtitle="Mayor engagement"
        icon={HeartIcon}
        post={highlights.mostReacted}
        onOpen={onOpen}
      />
    </div>
  );
}
