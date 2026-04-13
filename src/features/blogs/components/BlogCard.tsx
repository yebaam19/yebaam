import { CheckBadgeIcon, DocumentTextIcon, EyeIcon, UserGroupIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import Link from 'next/link'
import { FC } from 'react'
import type { Blog } from '../types/blog.types'
import { formatFollowersCount, formatViewsCount, getCategoryColor, getCategoryLabel } from '../utils/blogHelpers'

interface BlogCardProps {
  blog: Blog
  onFollow?: (blogId: string) => void
  onUnfollow?: (blogId: string) => void
  isLoading?: boolean
}

export const BlogCard: FC<BlogCardProps> = ({ blog, onFollow, onUnfollow, isLoading = false }) => {
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
    <Link href={`/feed/blogs/${blog.slug}`}>
      <div className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
        {/* Cover Image */}
        <div className="relative h-40 bg-linear-to-r from-secondary-700 via-secondary-800 to-secondary-900">
          {blog.coverImageUrl ? (
            <Image src={blog.coverImageUrl} alt={blog.name} fill className="object-cover" unoptimized />
          ) : null}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Author */}
          <div className="mb-3 flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
              {blog.owner?.avatar ? (
                <Image
                  src={blog.owner.avatar}
                  alt={blog.owner.name || 'Usuario'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
                  <span className="text-sm font-semibold text-white">{blog.owner?.name?.charAt(0) || 'U'}</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                {blog.owner?.name || 'Usuario desconocido'}
              </p>
              <p className="truncate text-xs text-neutral-600 dark:text-neutral-400">
                @{blog.owner?.username || 'unknown'}
              </p>
            </div>
            {blog.owner?.isVerified && <CheckBadgeIcon className="h-5 w-5 shrink-0 text-primary-500" />}
          </div>

          {/* Blog Title */}
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-neutral-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            {blog.name}
          </h3>

          {/* Category */}
          <span
            className={`mb-3 inline-block rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(blog.category)}`}
          >
            {getCategoryLabel(blog.category)}
          </span>

          {/* Description */}
          <p className="mb-4 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">{blog.description}</p>

          {/* Stats */}
          <div className="mb-4 flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-1">
              <UserGroupIcon className="h-4 w-4" />
              <span className="font-medium">{formatFollowersCount(blog.stats.followersCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <DocumentTextIcon className="h-4 w-4" />
              <span>{blog.stats.postsCount} posts</span>
            </div>
            <div className="flex items-center gap-1">
              <EyeIcon className="h-4 w-4" />
              <span>{formatViewsCount(blog.stats.totalViews)}</span>
            </div>
          </div>

          {/* Action Button */}
          {!blog.isOwner && (
            <button
              onClick={handleFollowClick}
              disabled={isLoading}
              className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                blog.isFollowing
                  ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
                  : 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
              } disabled:cursor-not-allowed disabled:opacity-50`}
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
                  Procesando...
                </span>
              ) : blog.isFollowing ? (
                'Siguiendo'
              ) : (
                'Seguir'
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
