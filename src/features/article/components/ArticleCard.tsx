'use client'

/**
 * ArticleCard Component
 *
 * Compact card view of an article for listing pages
 */

import Avatar from '@/ui/Avatar'
import { ChatBubbleLeftIcon, ClockIcon, EyeIcon, HeartIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import Link from 'next/link'
import { ArticleBasic } from '../interfaces'
import { formatRelativeDate } from '../utils/date-utils'

interface ArticleCardProps {
  article: ArticleBasic
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      href={`/feed/article/${article.id}`}
      className="group block overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
    >
      {article.headerImageUrl && (
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={article.headerImageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="p-4">
        {/* Author info */}
        <div className="mb-3 flex items-center gap-2">
          <Avatar
            src={article.author.avatarUrl}
            initials={article.author.displayName.slice(0, 2).toUpperCase()}
            alt={article.author.displayName}
            className="size-8"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-neutral-900 dark:text-white">
              {article.author.displayName}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span>{formatRelativeDate(article.createdAt)}</span>
              {article.readTime && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {article.readTime} min
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Title and summary */}
        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
          {article.title}
        </h3>

        {article.subtitle && (
          <p className="mb-3 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">{article.subtitle}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1">
            <EyeIcon className="h-3.5 w-3.5" />
            {article._count.views}
          </div>
          <div className="flex items-center gap-1">
            <HeartIcon className="h-3.5 w-3.5" />
            {article._count.likes}
          </div>
          <div className="flex items-center gap-1">
            <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
            {article._count.comments}
          </div>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {article.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
              >
                {tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">+{article.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
