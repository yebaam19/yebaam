'use client'

/**
 * ArticleFeedCard Component
 *
 * Article card for feed display with support for list and grid modes.
 * Adapted from legacy Article.tsx component.
 */

import Avatar from '@/ui/Avatar'
import { ChatBubbleLeftIcon, ClockIcon, EyeIcon, HeartIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import Link from 'next/link'
import { ArticleBasic } from '../interfaces'
import { formatRelativeDate } from '../utils/date-utils'
import type { Route } from 'next';

interface ArticleFeedCardProps {
  article: ArticleBasic
  /** Display mode: list (horizontal) or grid (vertical compact) */
  variant?: 'list' | 'grid'
}

export function ArticleFeedCard({ article, variant = 'list' }: ArticleFeedCardProps) {
  const isGrid = variant === 'grid'

  return (
    <article
      className={`group/article space-y-3 rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-neutral-800 ${
        isGrid ? 'flex h-full flex-col p-4' : 'p-5'
      }`}
    >
      {/* Author header */}
      <div className="flex gap-3">
        <Link href={`/users/${article.author.username}` as Route} className="shrink-0">
          <Avatar
            src={article.author.avatarUrl}
            initials={article.author.displayName.slice(0, 2).toUpperCase()}
            alt={article.author.displayName}
            className={isGrid ? 'size-8' : 'size-12'}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/users/${article.author.username}` as Route}
            className={`block font-medium text-neutral-900 hover:underline dark:text-white ${
              isGrid ? 'truncate text-sm' : 'text-base'
            }`}
          >
            {article.author.displayName}
          </Link>
          <Link
            href={`/feed/article/${article.id}` as Route}
            className={`block text-neutral-500 hover:underline dark:text-neutral-400 ${isGrid ? 'text-xs' : 'text-sm'}`}
            suppressHydrationWarning
          >
            {formatRelativeDate(article.createdAt)}
          </Link>
        </div>
      </div>

      {/* Cover image */}
      {article.headerImageUrl && (
        <div
          className={`aspect-video relative w-full overflow-hidden bg-neutral-100 dark:bg-neutral-700 ${
            isGrid ? 'rounded-lg' : 'rounded-xl'
          }`}
        >
          <Image
            src={article.headerImageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-200 group-hover/article:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
        </div>
      )}

      {/* Content */}
      <div className={isGrid ? 'flex-1' : ''}>
        <Link
          href={`/feed/article/${article.id}` as Route}
          className="block space-y-2 hover:text-neutral-600 dark:hover:text-neutral-300"
        >
          <h2
            className={`leading-tight font-bold text-neutral-900 dark:text-white ${
              isGrid ? 'line-clamp-2 text-lg' : 'text-xl'
            }`}
          >
            {article.title}
          </h2>
          {article.subtitle && (
            <p className={`text-neutral-500 dark:text-neutral-400 ${isGrid ? 'line-clamp-2 text-sm' : 'text-base'}`}>
              {article.subtitle}
            </p>
          )}
          {article.summary && (
            <p className={`text-sm text-neutral-500 dark:text-neutral-400 ${isGrid ? 'line-clamp-2' : 'line-clamp-3'}`}>
              {article.summary}
            </p>
          )}
        </Link>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className={`mt-3 flex flex-wrap ${isGrid ? 'gap-1' : 'gap-2'}`}>
            {article.tags.slice(0, isGrid ? 2 : 3).map((tag) => (
              <span
                key={tag}
                className={`rounded-full bg-neutral-100 text-xs text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 ${
                  isGrid ? 'px-2 py-1' : 'px-3 py-1'
                }`}
              >
                #{tag}
              </span>
            ))}
            {article.tags.length > (isGrid ? 2 : 3) && (
              <span className={`text-xs text-neutral-500 dark:text-neutral-400 ${isGrid ? 'self-center' : ''}`}>
                +{article.tags.length - (isGrid ? 2 : 3)} {isGrid ? '' : 'más'}
              </span>
            )}
          </div>
        )}
      </div>

      <hr className="border-neutral-200 dark:border-neutral-700" />

      {/* Stats and footer */}
      <div className={isGrid ? 'space-y-2' : 'space-y-3'}>
        <div
          className={`flex items-center justify-between text-neutral-500 dark:text-neutral-400 ${
            isGrid ? 'text-xs' : 'text-sm'
          }`}
        >
          <div className={`flex items-center ${isGrid ? 'gap-3' : 'gap-4'}`}>
            {article.readTime && (
              <div className="flex items-center gap-1">
                <ClockIcon className={isGrid ? 'size-3' : 'size-4'} />
                {isGrid ? (
                  <>
                    <span className="hidden sm:inline">{article.readTime} min</span>
                    <span className="sm:hidden">{article.readTime}m</span>
                  </>
                ) : (
                  <span>{article.readTime} min de lectura</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-1">
              <EyeIcon className={isGrid ? 'size-3' : 'size-4'} />
              <span>
                {article._count.views} {isGrid ? '' : 'visualizaciones'}
              </span>
            </div>
          </div>

          <div className={`flex items-center ${isGrid ? 'gap-3' : 'gap-4'}`}>
            <span className="flex items-center gap-1">
              <HeartIcon className={isGrid ? 'size-3' : 'size-4'} />
              {article._count.likes} {isGrid ? '' : 'me gusta'}
            </span>
            <span className="flex items-center gap-1">
              <ChatBubbleLeftIcon className={isGrid ? 'size-3' : 'size-4'} />
              {article._count.comments} {isGrid ? '' : 'comentarios'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center rounded-full bg-primary-100 font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-300 ${
              isGrid ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'
            }`}
          >
            Artículo
          </span>
          <Link
            href={`/feed/article/${article.id}` as Route}
            className={`font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 ${
              isGrid ? 'text-xs' : 'text-sm'
            }`}
          >
            Leer más →
          </Link>
        </div>
      </div>
    </article>
  )
}
