'use client'

import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces'
import { PlayIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'

interface BlogReelProps {
  posts: Post[]
}

interface ReelTile {
  postId: string
  url: string
}

export const BlogReel = ({ posts }: BlogReelProps) => {
  const reelTiles: ReelTile[] = posts
    .flatMap((post) =>
      (post.mediaFiles || [])
        .filter((m) => m.type?.toUpperCase() === 'VIDEO')
        .map((m) => ({ postId: post.id, url: m.url }))
    )
    .slice(0, 12)

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Reel</h2>
        <span className="text-xs text-neutral-400">Spots cortos</span>
      </div>

      {reelTiles.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-neutral-200 text-sm text-neutral-400 dark:border-neutral-700">
          Aún no hay reels
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {reelTiles.map((tile) => (
            <Link
              key={`${tile.postId}-${tile.url}`}
              href={`/feed/post/${tile.postId}`}
              className="group relative aspect-9/16 h-40 shrink-0 overflow-hidden rounded-md bg-black"
            >
              <video src={tile.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition-opacity group-hover:bg-black/10">
                <PlayIcon className="h-8 w-8 text-white/90" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
