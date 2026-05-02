import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { StreamVideo } from '@/components/media/StreamVideo';
import { NewspaperIcon } from '@/components/icons/heroicons-shim';
import type { CommunityPost } from '@/features/communities/types/community.types';

interface CommunityPostCardProps {
  post: CommunityPost;
}

export function CommunityPostCard({ post }: CommunityPostCardProps) {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        {post.authorAvatar && (
          <Image
            src={post.authorAvatar}
            alt={post.authorName}
            width={36}
            height={36}
            className="rounded-full"
            style={{ width: 36, height: 36 }}
            unoptimized
          />
        )}
        <div>
          <p className="font-semibold text-sm text-gray-900 dark:text-white">{post.authorName}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {new Date(post.createdAt).toLocaleDateString('es-MX')}
          </p>
        </div>
      </div>
      {post.content && (
        <p className="text-sm text-gray-900 dark:text-white mb-3 whitespace-pre-wrap">
          {post.content}
        </p>
      )}
      {post.articleRef && (
        <Link
          href={post.articleRef.href as Route}
          className="mb-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-linear-to-br from-blue-50 to-indigo-50 p-3 transition-colors hover:border-blue-300 hover:from-blue-100 hover:to-indigo-100 dark:border-gray-700 dark:from-blue-950/30 dark:to-indigo-950/30 dark:hover:border-blue-700"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm">
            <NewspaperIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Artículo de la comunidad
            </p>
            <p className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
              {post.articleRef.title}
            </p>
          </div>
        </Link>
      )}
      {post.media && post.media.length > 0 && (
        <div className="mb-3 space-y-2">
          {post.media.some((m) => m.kind === 'video') && (
            <div className="space-y-2">
              {post.media
                .filter((m) => m.kind === 'video' && m.cfVideoUid)
                .map((m) => (
                  <StreamVideo
                    key={m.cfVideoUid}
                    uid={m.cfVideoUid as string}
                    aspectRatio="16 / 9"
                    controls
                    className="rounded-md overflow-hidden"
                  />
                ))}
            </div>
          )}
          {post.media.some((m) => m.kind === 'image') && (
            <div className="grid grid-cols-2 gap-2">
              {post.media
                .filter((m) => m.kind === 'image' && m.url)
                .map((m) => (
                  <div key={m.url} className="relative aspect-square">
                    <Image
                      src={m.url as string}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 50vw, 300px"
                      className="object-cover rounded-md"
                      unoptimized
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
        <span>{post.likesCount} me gusta</span>
        <span>•</span>
        <span>{post.commentsCount} comentarios</span>
      </div>
    </article>
  );
}
