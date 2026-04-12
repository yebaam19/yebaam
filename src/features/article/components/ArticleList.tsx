'use client'

/**
 * ArticleList Component
 *
 * Displays a grid or list of article cards
 */

import { ArticleBasic } from '../interfaces'
import { ArticleCard } from './ArticleCard'

interface ArticleListProps {
  articles: ArticleBasic[]
  isLoading?: boolean
  emptyMessage?: string
  layout?: 'grid' | 'list'
}

export function ArticleList({
  articles,
  isLoading = false,
  emptyMessage = 'No hay artículos disponibles',
  layout = 'grid',
}: ArticleListProps) {
  if (isLoading) {
    return (
      <div className={layout === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-neutral-500 dark:text-neutral-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={layout === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  )
}

function ArticleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      <div className="h-48 w-full animate-pulse bg-neutral-200 dark:bg-neutral-700" />
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="flex-1 space-y-1">
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-3 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
        <div className="h-6 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="flex gap-4">
          <div className="h-4 w-12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
    </div>
  )
}
