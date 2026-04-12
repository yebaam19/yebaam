'use client'

/**
 * ArticleCardWrapper Component
 *
 * Wraps an article card with context information header.
 * Shows the article's origin (Blog, Professional Profile, Personal, Club).
 * Adapted from legacy ArticleWrapper.tsx component.
 */

import { ReactNode } from 'react'
import { ArticleContextType } from '../interfaces'
import { ArticleContextBadge } from './ArticleContextBadge'

interface ArticleCardWrapperProps {
  contextType: ArticleContextType
  contextId?: string | null
  authorUsername: string
  children: ReactNode
}

export function ArticleCardWrapper({ contextType, contextId, authorUsername, children }: ArticleCardWrapperProps) {
  // Don't show wrapper for personal articles (default context)
  if (contextType === ArticleContextType.USER_PROFILE) {
    return <>{children}</>
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <ArticleContextBadge
        contextType={contextType}
        contextId={contextId}
        authorUsername={authorUsername}
        variant="header"
      />
      <div className="[&>article]:rounded-none [&>article]:border-none [&>article]:shadow-none">{children}</div>
    </div>
  )
}
