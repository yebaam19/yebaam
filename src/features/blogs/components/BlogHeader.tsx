'use client'

import { useAuth } from '@/features/auth'
import Avatar from '@/ui/Avatar'
import { CheckBadgeIcon, PencilIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { Blog } from '../types/blog.types'
import { getCategoryColor, getCategoryLabel } from '../utils/blogHelpers'

interface BlogHeaderProps {
  blog: Blog
  onEdit?: () => void
  onFollowToggle?: () => void
  isFollowLoading?: boolean
}

export const BlogHeader = ({ blog, onEdit, onFollowToggle, isFollowLoading }: BlogHeaderProps) => {
  const { user } = useAuth()
  const tHeader = useTranslations('blogs.header')
  const tCard = useTranslations('blogs.card')
  const tDetail = useTranslations('blogs.detail')

  if (!user) return null
  const userAvatar = user.avatarUrl || user.avatar
  return (
    <>
      {/* Cover Image */}
      <div className="relative h-64 bg-linear-to-r from-secondary-700 via-secondary-800 to-secondary-900 md:h-80">
        {blog.coverImageUrl && (
          <Image src={blog.coverImageUrl} alt={blog.name} fill sizes="100vw" className="object-cover" unoptimized priority />
        )}
      </div>

      {/* Header Info */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 border-b border-gray-200 pb-8 dark:border-gray-700">
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <div className="flex flex-col gap-6 md:flex-row">
              {/* Blog Avatar (Logo) */}
              <div className="shrink-0">
                <Avatar
                  className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white dark:border-gray-800"
                  src={userAvatar}
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    {/* Title */}
                    <div className="mb-2 flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">{blog.name}</h1>
                      {blog.isVerified && <CheckBadgeIcon className="h-7 w-7 shrink-0 text-primary-500" />}
                    </div>

                    {/* Owner */}
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {tHeader('byPrefix')}{' '}
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {blog.owner?.name || tCard('unknownUser')}
                        </span>
                      </span>
                    </div>

                    {/* Category */}
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(blog.category)}`}
                    >
                      {getCategoryLabel(blog.category)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {blog.isOwner ? (
                      <button
                        onClick={onEdit}
                        className="flex shrink-0 items-center gap-2 rounded-lg bg-neutral-100 px-6 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                        {tDetail('editBlog')}
                      </button>
                    ) : (
                      <button
                        onClick={onFollowToggle}
                        disabled={isFollowLoading}
                        className={`shrink-0 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors ${
                          blog.isFollowing
                            ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
                            : 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {isFollowLoading
                          ? tCard('processing')
                          : blog.isFollowing
                            ? tHeader('unfollow')
                            : tHeader('follow')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
