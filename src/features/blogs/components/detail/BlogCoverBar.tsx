'use client'

import {
  EnvelopeIcon,
  HandThumbUpIcon,
  HeartIcon,
  HeartSolidIcon,
  PlusIcon,
  StarIcon,
  StarSolidIcon,
} from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { useState } from 'react'
import type { Blog } from '../../types/blog.types'

interface BlogCoverBarProps {
  blog: Blog
  stars: 0 | 1 | 2 | 3 | 4 | 5
  onFollowToggle: () => void
  isFollowLoading?: boolean
}

export const BlogCoverBar = ({ blog, stars, onFollowToggle, isFollowLoading }: BlogCoverBarProps) => {
  // TODO(blog-reactions): wire to blog_reactions table once created
  const [liked, setLiked] = useState(false)
  const [recommended, setRecommended] = useState(false)

  return (
    <div className="relative h-48 overflow-hidden rounded-b-2xl bg-linear-to-r from-secondary-700 via-secondary-800 to-secondary-900 sm:h-64 md:h-80">
      {blog.coverImageUrl && (
        <Image src={blog.coverImageUrl} alt={blog.name} fill sizes="100vw" className="object-cover" unoptimized priority />
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-black/20" />

      {/* Stars (top-left) */}
      <div className="absolute top-3 left-3 flex items-center gap-0.5 rounded-full bg-black/40 px-2 py-1 backdrop-blur-sm sm:top-4 sm:left-4 sm:gap-1 sm:px-3 sm:py-1.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const Icon = i < stars ? StarSolidIcon : StarIcon
          return (
            <Icon
              key={i}
              className={`h-3 w-3 sm:h-4 sm:w-4 ${i < stars ? 'text-amber-400' : 'text-white/60'}`}
            />
          )
        })}
      </div>

      {/* Action buttons (top-right) */}
      <div className="absolute top-3 right-3 flex max-w-[calc(100%-6rem)] flex-row flex-wrap justify-end gap-1.5 sm:top-4 sm:right-4 sm:flex-col sm:gap-2">
        <button
          type="button"
          onClick={() => setRecommended((v) => !v)}
          title="Recomendar (R+)"
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold shadow backdrop-blur-sm transition-colors sm:px-3 sm:py-1.5 sm:text-xs ${
            recommended
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-white/90 text-neutral-800 hover:bg-white'
          }`}
        >
          <PlusIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          R+
        </button>

        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          title="Me gusta"
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold shadow backdrop-blur-sm transition-colors sm:px-3 sm:py-1.5 sm:text-xs ${
            liked ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-white/90 text-neutral-800 hover:bg-white'
          }`}
        >
          {liked ? (
            <HeartSolidIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          ) : (
            <HeartIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          )}
          <span>Me gusta</span>
        </button>

        <button
          type="button"
          onClick={onFollowToggle}
          disabled={isFollowLoading || blog.isOwner}
          title={blog.isOwner ? 'Eres el dueño del blog' : blog.isFollowing ? 'Dejar de seguir' : 'Seguir'}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold shadow backdrop-blur-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-1.5 sm:text-xs ${
            blog.isFollowing
              ? 'bg-white/90 text-neutral-800 hover:bg-white'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          <HandThumbUpIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          {isFollowLoading ? '...' : blog.isFollowing ? 'Siguiendo' : 'Seguir'}
        </button>

        <button
          type="button"
          disabled
          title="Próximamente"
          className="flex cursor-not-allowed items-center gap-1 rounded-md bg-white/70 px-2 py-1 text-[11px] font-semibold text-neutral-700 shadow backdrop-blur-sm opacity-80 sm:px-3 sm:py-1.5 sm:text-xs"
        >
          <EnvelopeIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          Contacto
        </button>
      </div>
    </div>
  )
}
