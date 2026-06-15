'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { ClubPost, ClubPostKind } from '@/features/clubs/server/clubs.server';
import {
  ClockIcon,
  EyeIcon,
  HeartIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  FolderIcon,
  ChatBubbleOvalLeftIcon,
} from '@/components/icons/heroicons-shim';
import { clubPostThumb } from './postMedia';

interface ClubHighlightedPostsProps {
  highlights: {
    mostRecent: ClubPost | null;
    mostViewed: ClubPost | null;
    mostReacted: ClubPost | null;
  };
  onOpen?: (postId: string) => void;
}

const KIND_ICON: Record<ClubPostKind, typeof PhotoIcon> = {
  NOTE: ChatBubbleOvalLeftIcon,
  PHOTO: PhotoIcon,
  VIDEO: VideoCameraIcon,
  ARTICLE: DocumentTextIcon,
  FILE: FolderIcon,
};

function Card({
  title,
  icon: TitleIcon,
  post,
  onOpen,
}: {
  title: string;
  icon: typeof ClockIcon;
  post: ClubPost | null;
  onOpen?: (id: string) => void;
}) {
  if (!post) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2.5 dark:border-gray-700">
        <TitleIcon className="h-4 w-4 shrink-0 text-gray-400" />
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">{title}</div>
          <div className="truncate text-[11px] text-gray-400">Sin publicaciones</div>
        </div>
      </div>
    );
  }
  const KindIcon = KIND_ICON[post.kind];
  const thumb = clubPostThumb(post);
  return (
    <button
      onClick={() => onOpen?.(post.id)}
      className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-700">
        {thumb ? (
          <Image
            src={thumb}
            alt={post.title || post.body?.slice(0, 100) || title}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
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
  const t = useTranslations('clubes');
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card
        title={t('detail.sort.mostRecent')}
        icon={ClockIcon}
        post={highlights.mostRecent}
        onOpen={onOpen}
      />
      <Card
        title={t('detail.sort.mostViewed')}
        icon={EyeIcon}
        post={highlights.mostViewed}
        onOpen={onOpen}
      />
      <Card
        title={t('detail.sort.mostReacted')}
        icon={HeartIcon}
        post={highlights.mostReacted}
        onOpen={onOpen}
      />
    </div>
  );
}
