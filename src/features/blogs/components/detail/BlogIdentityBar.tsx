'use client'

import { CheckBadgeIcon, StarIcon, StarSolidIcon, TrophyIcon } from '@/components/icons/heroicons-shim'
import Avatar from '@/ui/Avatar'
import { imageUrl, resolveImageRef } from '@/lib/media/urls'
import type { Blog } from '../../types/blog.types'
import { formatFollowersCount } from '../../utils/blogHelpers'
import { followerEmblem } from '../../utils/emblem'

interface BlogIdentityBarProps {
  blog: Blog
  stars: 0 | 1 | 2 | 3 | 4 | 5
}

const DISTINCTION_LABELS: Record<string, string> = {
  local: 'Distinción local',
  national: 'Distinción nacional',
  international: 'Distinción internacional',
}

export const BlogIdentityBar = ({ blog, stars }: BlogIdentityBarProps) => {
  const followers = blog.stats?.followersCount ?? 0
  const emblem = followerEmblem(followers)
  const badges = blog.badges ?? []

  return (
    <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
      <div className="shrink-0">
        <Avatar
          className="-mt-10 h-20 w-20 border-4 border-white shadow-md sm:-mt-16 sm:h-28 sm:w-28 dark:border-neutral-900"
          src={resolveImageRef(blog.profileImageUrl, 'avatar')}
          alt={blog.name}
        />
      </div>

      <div className="min-w-0 flex-1">
        {/* FRANJA DE BADGES — admin-granted achievements (PDF #3) */}
        <div className="mb-2 flex items-center gap-2 overflow-x-auto rounded-md border border-dashed border-neutral-200 bg-white/60 px-2 py-1.5 sm:px-3 dark:border-neutral-700 dark:bg-neutral-800/60">
          {badges.length > 0 ? (
            badges.map((badge) => (
              <span
                key={badge.slug}
                title={badge.name}
                className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-amber-500 sm:h-7 sm:w-7 dark:bg-neutral-700"
              >
                {badge.iconCfImageId ? (
                  <img
                    src={imageUrl(badge.iconCfImageId, 'public')}
                    alt={badge.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <TrophyIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </span>
            ))
          ) : (
            <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
              Aún sin insignias
            </span>
          )}
          <span className="ml-auto hidden text-[11px] font-medium uppercase tracking-wide text-neutral-400 sm:inline dark:text-neutral-500">
            Franja de Badges
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="truncate text-xl font-bold text-neutral-900 sm:text-2xl dark:text-white">{blog.name}</h1>

              {/* Three circles next to the name (PDF #5) */}
              <span className="flex items-center gap-1">
                {/* Circle 1 — artist authentication */}
                <span
                  title={blog.isVerified ? 'Artista autenticado por Yebaam' : 'Autenticación de artista pendiente'}
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    blog.isVerified
                      ? 'bg-primary-500 text-white'
                      : 'border border-dashed border-neutral-300 text-neutral-300 dark:border-neutral-600 dark:text-neutral-600'
                  }`}
                >
                  <CheckBadgeIcon className="h-3.5 w-3.5" />
                </span>

                {/* Circle 2 — distinction (local / national / international) */}
                <span
                  title={blog.distinction ? DISTINCTION_LABELS[blog.distinction] : 'Sin distinción registrada'}
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    blog.distinction
                      ? 'bg-amber-500 text-white'
                      : 'border border-dashed border-neutral-300 text-neutral-300 dark:border-neutral-600 dark:text-neutral-600'
                  }`}
                >
                  <TrophyIcon className="h-3.5 w-3.5" />
                </span>

                {/* Circle 3 — follower-milestone emblem */}
                <span
                  title={emblem ? `Emblema ${emblem.label}` : 'Emblema por seguidores (desde 10.000)'}
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    emblem ? '' : 'border border-dashed border-neutral-300 dark:border-neutral-600'
                  }`}
                >
                  {emblem ? (
                    <span className={`h-3.5 w-3.5 rounded-full ring-2 ${emblem.dotClass}`} />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                  )}
                </span>
              </span>

              {/* Rating stars (existing) */}
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => {
                  const Icon = i < stars ? StarSolidIcon : StarIcon
                  return (
                    <Icon
                      key={i}
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${i < stars ? 'text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}`}
                    />
                  )
                })}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-neutral-600 sm:text-sm dark:text-neutral-400">
              <span className="font-medium">{formatFollowersCount(followers)}</span> seguidores
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
