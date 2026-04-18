'use client'

import { CheckBadgeIcon, StarIcon, StarSolidIcon, TrophyIcon } from '@/components/icons/heroicons-shim'
import Avatar from '@/ui/Avatar'
import type { Blog } from '../../types/blog.types'
import { formatFollowersCount } from '../../utils/blogHelpers'

interface BlogIdentityBarProps {
  blog: Blog
  stars: 0 | 1 | 2 | 3 | 4 | 5
}

export const BlogIdentityBar = ({ blog, stars }: BlogIdentityBarProps) => {
  return (
    <div className="relative flex flex-col gap-4 px-4 sm:flex-row sm:items-end sm:gap-6 sm:px-0">
      <div className="shrink-0">
        <Avatar
          className="-mt-16 h-28 w-28 border-4 border-white shadow-md dark:border-neutral-900"
          src={blog.profileImageUrl}
          alt={blog.name}
        />
      </div>

      <div className="min-w-0 flex-1">
        {/* FRANJA DE BADGES */}
        <div className="mb-2 flex items-center gap-2 overflow-x-auto rounded-md border border-dashed border-neutral-200 bg-white/60 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-800/60">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              title="Badge próximamente"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-300 dark:bg-neutral-700 dark:text-neutral-500"
            >
              <TrophyIcon className="h-4 w-4" />
            </span>
          ))}
          <span className="ml-auto text-[11px] font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Franja de Badges
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-bold text-neutral-900 dark:text-white">{blog.name}</h1>
              {blog.isVerified && <CheckBadgeIcon className="h-6 w-6 shrink-0 text-primary-500" />}
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => {
                  const Icon = i < stars ? StarSolidIcon : StarIcon
                  return (
                    <Icon
                      key={i}
                      className={`h-4 w-4 ${i < stars ? 'text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}`}
                    />
                  )
                })}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-medium">{formatFollowersCount(blog.stats?.followersCount ?? 0)}</span> seguidores
              <span className="mx-2 text-neutral-400">·</span>
              por{' '}
              <span className="font-medium text-neutral-900 dark:text-white">
                {blog.owner?.name || 'Autor desconocido'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
