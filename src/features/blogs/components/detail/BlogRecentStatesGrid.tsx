'use client'

import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces'
import { ChatBubbleLeftIcon, HeartIcon, PlayIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import Link from 'next/link'

interface BlogRecentStatesGridProps {
  posts: Post[]
}

export const BlogRecentStatesGrid = ({ posts }: BlogRecentStatesGridProps) => {
  const items = posts.slice(0, 12)

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Estados más recientes
      </h2>

      {items.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-neutral-200 text-sm text-neutral-400 dark:border-neutral-700">
          Este blog aún no tiene publicaciones
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((post) => {
            const firstMedia = post.mediaFiles?.[0]
            const isVideo = firstMedia?.type?.toUpperCase() === 'VIDEO'
            const likes = post.reactionsCount?.like ?? 0
            const comments = post.commentsCount ?? 0

            return (
              <Link
                key={post.id}
                href={`/feed/post/${post.id}`}
                className="group relative block aspect-square overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800"
              >
                {firstMedia?.url ? (
                  isVideo ? (
                    <video
                      src={firstMedia.url}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src={firstMedia.url}
                      alt={post.content?.slice(0, 80) || 'Publicación'}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
                  )
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-linear-to-br from-secondary-600 to-secondary-800 p-3 text-center text-xs font-medium text-white"
                    style={post.backgroundColor ? { background: post.backgroundColor } : undefined}
                  >
                    <span className="line-clamp-5">{post.content || 'Sin contenido'}</span>
                  </div>
                )}

                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <PlayIcon className="h-8 w-8 text-white/90" />
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-linear-to-t from-black/70 to-transparent px-2 py-1.5 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex items-center gap-1">
                    <HeartIcon className="h-3.5 w-3.5" /> {likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <ChatBubbleLeftIcon className="h-3.5 w-3.5" /> {comments}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
