'use client'

import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces'
import { HeartIcon, PhotoIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import Link from 'next/link'

interface BlogFeaturedPhotosProps {
  posts: Post[]
}

interface FeaturedTile {
  postId: string
  url: string
  likes: number
}

export const BlogFeaturedPhotos = ({ posts }: BlogFeaturedPhotosProps) => {
  const tiles: FeaturedTile[] = posts
    .flatMap((post) =>
      (post.mediaFiles || [])
        .filter((m) => m.type?.toUpperCase() === 'IMAGE')
        .map((m) => ({ postId: post.id, url: m.url, likes: post.reactionsCount?.like ?? 0 }))
    )
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 3)

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Fotos Destacadas
      </h2>

      {tiles.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-neutral-200 text-sm text-neutral-400 dark:border-neutral-700">
          <div className="flex flex-col items-center gap-1">
            <PhotoIcon className="h-6 w-6" />
            Sin fotos aún
          </div>
        </div>
      ) : (
        tiles.map((tile) => (
          <Link
            key={`${tile.postId}-${tile.url}`}
            href={`/feed/post/${tile.postId}`}
            className="group relative aspect-4/3 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800"
          >
            <Image src={tile.url} alt="Foto destacada" fill sizes="(max-width: 1024px) 100vw, 300px" className="object-cover" unoptimized />
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-linear-to-t from-black/70 to-transparent px-2 py-1.5 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
              <HeartIcon className="h-3.5 w-3.5" /> {tile.likes}
            </div>
          </Link>
        ))
      )}
    </section>
  )
}
