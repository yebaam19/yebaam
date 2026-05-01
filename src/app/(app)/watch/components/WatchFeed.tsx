'use client';

import Link from 'next/link';
import type { Route } from 'next';
import Image from 'next/image';
import { StreamVideo } from '@/components/media/StreamVideo';
import type { WatchVideo } from '@/features/watch/server/watch.server';

interface WatchFeedProps {
  videos: WatchVideo[];
}

function authorDisplayName(author: WatchVideo['author']): string {
  const full = `${author.firstName} ${author.lastName}`.trim();
  if (full) return full;
  if (author.username) return `@${author.username}`;
  return 'Usuario';
}

function authorHref(author: WatchVideo['author']): string | undefined {
  if (!author.username) return undefined;
  return `/${author.username}`;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `hace ${w} sem`;
  return new Date(iso).toLocaleDateString();
}

export function WatchFeed({ videos }: WatchFeedProps) {
  if (videos.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center text-sm text-gray-600 dark:text-gray-400">
        Aún no hay videos publicados. Sube uno desde el feed o tu galería para verlo aquí.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {videos.map((v) => {
        const ratio = v.aspectRatio ?? '16 / 9';
        const href = authorHref(v.author);
        return (
          <article
            key={v.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden flex flex-col"
          >
            <StreamVideo
              uid={v.cfVideoUid}
              aspectRatio={ratio}
              controls
              className="bg-black"
              title={v.caption ?? authorDisplayName(v.author)}
            />
            <div className="p-3 flex gap-3">
              {v.author.avatar ? (
                <Image
                  src={v.author.avatar}
                  alt={authorDisplayName(v.author)}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                {v.caption && (
                  <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                    {v.caption}
                  </p>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-1.5">
                  {href ? (
                    <Link
                      href={href as Route}
                      className="font-medium text-gray-700 dark:text-gray-200 hover:underline"
                    >
                      {authorDisplayName(v.author)}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {authorDisplayName(v.author)}
                    </span>
                  )}
                  {v.community && (
                    <>
                      <span aria-hidden>·</span>
                      <Link
                        href={`/feed/comunidades/${v.community.slug}` as Route}
                        className="hover:underline"
                      >
                        {v.community.name}
                      </Link>
                    </>
                  )}
                  <span aria-hidden>·</span>
                  <time dateTime={v.createdAt}>{timeAgo(v.createdAt)}</time>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
