'use client'

import { CheckBadgeIcon, DocumentTextIcon, EyeIcon, UserGroupIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import Link from 'next/link'
import { FC } from 'react'
import { useTranslations } from 'next-intl'
import type { Blog } from '../types/blog.types'
import { formatFollowersCount, formatViewsCount, getCategoryColor, getCategoryLabel } from '../utils/blogHelpers'

interface BlogCardProps {
  blog: Blog
  onFollow?: (blogId: string) => void
  onUnfollow?: (blogId: string) => void
  isLoading?: boolean
}

export const BlogCard: FC<BlogCardProps> = ({ blog, onFollow, onUnfollow, isLoading = false }) => {
  const t = useTranslations('blogs.card')
  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLoading) return

    if (blog.isFollowing) {
      onUnfollow?.(blog.id)
    } else {
      onFollow?.(blog.id)
    }
  }

  return (
    <Link href={`/feed/blogs/${blog.slug}`} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
        {/* Cover */}
        <div className="relative h-32 overflow-hidden bg-linear-to-br from-secondary-600 via-secondary-700 to-secondary-900">
          {blog.coverImageUrl ? (
            <Image
              src={blog.coverImageUrl}
              alt={blog.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
              className="object-cover"
              unoptimized
            />
          ) : null}
          <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/0 to-black/25" />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          {/* Author */}
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white dark:ring-neutral-900">
              {blog.owner?.avatar ? (
                <Image
                  src={blog.owner.avatar}
                  alt={blog.owner.name || t('fallbackUserAlt')}
                  fill
                  sizes="36px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary-500 to-primary-700">
                  <span className="text-xs font-semibold text-white">{blog.owner?.name?.charAt(0) || 'U'}</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 truncate text-sm font-medium text-neutral-900 dark:text-white">
                <span className="truncate">{blog.owner?.name || t('unknownUser')}</span>
                {blog.owner?.isVerified && <CheckBadgeIcon className="h-4 w-4 shrink-0 text-primary-500" />}
              </p>
              <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                @{blog.owner?.username || t('fallbackUsername')}
              </p>
            </div>
          </div>

          {/* Title + category */}
          <div className="space-y-1.5">
            <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-neutral-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
              {blog.name}
            </h3>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getCategoryColor(blog.category)}`}
            >
              {getCategoryLabel(blog.category)}
            </span>
          </div>

          {/* Description */}
          <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            {blog.description}
          </p>

          {/* Stats */}
          <div className="mt-auto flex items-center gap-3 border-t border-neutral-100 pt-3 text-xs text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
            <div className="flex min-w-0 items-center gap-1">
              <UserGroupIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-medium">{formatFollowersCount(blog.stats.followersCount)}</span>
            </div>
            <div className="flex min-w-0 items-center gap-1">
              <DocumentTextIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{blog.stats.postsCount}</span>
            </div>
            <div className="flex min-w-0 items-center gap-1">
              <EyeIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{formatViewsCount(blog.stats.totalViews)}</span>
            </div>
          </div>

          {/* Action */}
          {!blog.isOwner && (
            <button
              onClick={handleFollowClick}
              disabled={isLoading}
              className={`w-full rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                blog.isFollowing
                  ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  : 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t('processing')}
                </span>
              ) : blog.isFollowing ? (
                t('following')
              ) : (
                t('follow')
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
