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
    <div className="relative h-64 overflow-hidden rounded-b-2xl bg-linear-to-r from-secondary-700 via-secondary-800 to-secondary-900 md:h-80">
      {blog.coverImageUrl && (
        <Image src={blog.coverImageUrl} alt={blog.name} fill className="object-cover" unoptimized priority />
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-black/20" />

      {/* Stars (top-left) */}
      <div className="absolute top-4 left-4 flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
        {Array.from({ length: 5 }).map((_, i) => {
          const Icon = i < stars ? StarSolidIcon : StarIcon
          return <Icon key={i} className={`h-4 w-4 ${i < stars ? 'text-amber-400' : 'text-white/60'}`} />
        })}
      </div>

      {/* Action buttons (top-right) */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setRecommended((v) => !v)}
          title="Recomendar (R+)"
          className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold shadow backdrop-blur-sm transition-colors ${
            recommended
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-white/90 text-neutral-800 hover:bg-white'
          }`}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          R+
        </button>

        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          title="Me gusta"
          className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold shadow backdrop-blur-sm transition-colors ${
            liked ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-white/90 text-neutral-800 hover:bg-white'
          }`}
        >
          {liked ? <HeartSolidIcon className="h-3.5 w-3.5" /> : <HeartIcon className="h-3.5 w-3.5" />}
          Me gusta
        </button>

        <button
          type="button"
          onClick={onFollowToggle}
          disabled={isFollowLoading || blog.isOwner}
          title={blog.isOwner ? 'Eres el dueño del blog' : blog.isFollowing ? 'Dejar de seguir' : 'Seguir'}
          className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold shadow backdrop-blur-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            blog.isFollowing
              ? 'bg-white/90 text-neutral-800 hover:bg-white'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          <HandThumbUpIcon className="h-3.5 w-3.5" />
          {isFollowLoading ? '...' : blog.isFollowing ? 'Siguiendo' : 'Seguir'}
        </button>

        <button
          type="button"
          disabled
          title="Próximamente"
          className="flex cursor-not-allowed items-center gap-1 rounded-md bg-white/70 px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow backdrop-blur-sm opacity-80"
        >
          <EnvelopeIcon className="h-3.5 w-3.5" />
          Contacto
        </button>
      </div>
    </div>
  )
}
