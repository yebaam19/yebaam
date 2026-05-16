'use client'

/**
 * ArticleFormHeader Component
 *
 * Header for article creation/edit form with user info,
 * context selector, editor toolbar, and publish button
 */

import Avatar from '@/ui/Avatar'
import { Button } from '@/ui/Button'
import { useTranslations } from 'next-intl'
import { ArticleContextType } from '../interfaces'
import { ArticleContextSelector } from './ArticleContextSelector'

interface ArticleUser {
  id: string
  avatarUrl: string | null
  displayName: string
  username: string
}

interface ArticleFormHeaderProps {
  user: ArticleUser
  onPublish: () => void
  isPublishing: boolean
  selectedContext: {
    type: ArticleContextType
    id: string | null
    name: string
  }
  onContextChange: (context: { type: ArticleContextType; id: string | null; name: string }) => void
  isLoadingContexts?: boolean
  toolbarSlot?: React.ReactNode
}

export function ArticleFormHeader({
  user,
  onPublish,
  isPublishing,
  selectedContext,
  onContextChange,
  isLoadingContexts = false,
  toolbarSlot,
}: ArticleFormHeaderProps) {
  const t = useTranslations('article.editor')
  return (
    <div className="border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
      <div className="mx-auto max-w-4xl px-4">
        {/* Desktop Layout */}
        <div className="hidden items-center justify-between gap-4 py-3 lg:flex">
          <div className="flex shrink-0 items-center gap-3">
            <Avatar
              src={user.avatarUrl}
              alt={user.displayName}
              initials={user.displayName?.slice(0, 2).toUpperCase()}
              className="h-8 w-8"
            />
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">{user.displayName}</p>
              <ArticleContextSelector
                selectedContext={selectedContext}
                onSelect={onContextChange}
                authorId={user.id}
                isLoading={isLoadingContexts}
                variant="compact"
              />
            </div>
          </div>

          {toolbarSlot && <div className="max-w-md flex-1">{toolbarSlot}</div>}

          <Button color="primary" onClick={onPublish} className="shrink-0" disabled={isPublishing}>
            {isPublishing ? t('publishing') : t('publish')}
          </Button>
        </div>

        {/* Mobile Layout */}
        <div className="space-y-3 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={user.avatarUrl}
                alt={user.displayName}
                initials={user.displayName?.slice(0, 2).toUpperCase()}
                className="h-8 w-8"
              />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">{user.displayName}</p>
                <ArticleContextSelector
                  selectedContext={selectedContext}
                  onSelect={onContextChange}
                  authorId={user.id}
                  isLoading={isLoadingContexts}
                  variant="compact"
                />
              </div>
            </div>
            <Button color="primary" onClick={onPublish} className="shrink-0" disabled={isPublishing}>
              {isPublishing ? t('publishing') : t('publish')}
            </Button>
          </div>

          {toolbarSlot && <div className="flex justify-center">{toolbarSlot}</div>}
        </div>
      </div>
    </div>
  )
}
