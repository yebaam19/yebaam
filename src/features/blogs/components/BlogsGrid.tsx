'use client'

import { FC } from 'react'
import { useTranslations } from 'next-intl'
import type { Blog } from '../types/blog.types'
import { BlogCard } from './BlogCard'

interface BlogsGridProps {
  blogs: Blog[]
  onFollow?: (blogId: string) => void
  onUnfollow?: (blogId: string) => void
  loadingBlogId?: string | null
  emptyMessage?: string
  /** Forwarded to each BlogCard so detail links resolve under the right mount. */
  basePath?: string
}

export const BlogsGrid: FC<BlogsGridProps> = ({
  blogs,
  onFollow,
  onUnfollow,
  loadingBlogId,
  emptyMessage,
  basePath,
}) => {
  const t = useTranslations('blogs.grid')
  const resolvedEmpty = emptyMessage ?? t('emptyDefault')
  if (blogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/50 px-6 py-16 text-center dark:border-neutral-700 dark:bg-neutral-900/40">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-secondary-100 to-secondary-200 text-secondary-700 shadow-sm dark:from-secondary-900/40 dark:to-secondary-800/40 dark:text-secondary-300">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h3 className="mb-1.5 text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
          {resolvedEmpty}
        </h3>
        <p className="max-w-md text-sm text-neutral-600 dark:text-neutral-400">
          {t('emptyHint')}
        </p>
      </div>
    )
  }

  return (
    <div className="grid w-full gap-4 sm:gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
      {blogs.map((blog) => (
        <BlogCard
          key={blog.id}
          blog={blog}
          onFollow={onFollow}
          onUnfollow={onUnfollow}
          isLoading={loadingBlogId === blog.id}
          basePath={basePath}
        />
      ))}
    </div>
  )
}
