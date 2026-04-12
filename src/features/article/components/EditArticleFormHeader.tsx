'use client'

/**
 * EditArticleFormHeader Component
 *
 * Header for article edit form with user info,
 * editor toolbar, cancel and save buttons
 * Matching legacy EditArticleFormHeader
 */

import Avatar from '@/ui/Avatar'
import { Button } from '@/ui/Button'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'

interface ArticleUser {
  id: string
  avatarUrl: string | null
  displayName: string
  username: string
}

interface EditArticleFormHeaderProps {
  user: ArticleUser
  articleTitle: string
  onUpdate: () => void
  onCancel: () => void
  isUpdating: boolean
  toolbarSlot?: React.ReactNode
}

export function EditArticleFormHeader({
  user,
  articleTitle,
  onUpdate,
  onCancel,
  isUpdating,
  toolbarSlot,
}: EditArticleFormHeaderProps) {
  return (
    <div className="sticky top-[106px] z-20 border-b border-neutral-200 bg-white md:top-14 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="px-4 sm:px-6">
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
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Editando: {articleTitle.length > 30 ? `${articleTitle.slice(0, 30)}...` : articleTitle}
              </p>
            </div>
          </div>

          {toolbarSlot && <div className="max-w-md flex-1">{toolbarSlot}</div>}

          <div className="flex shrink-0 items-center gap-2">
            <Button outline onClick={onCancel} disabled={isUpdating} className="gap-2">
              <XMarkIcon className="h-4 w-4" />
              Cancelar
            </Button>
            <Button color="primary" onClick={onUpdate} disabled={isUpdating} className="gap-2">
              <CheckIcon className="h-4 w-4" />
              {isUpdating ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
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
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Editando artículo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button outline onClick={onCancel} disabled={isUpdating} className="p-2">
                <XMarkIcon className="h-4 w-4" />
              </Button>
              <Button color="primary" onClick={onUpdate} disabled={isUpdating} className="gap-1 text-sm">
                <CheckIcon className="h-4 w-4" />
                {isUpdating ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>

          {/* Toolbar for mobile */}
          {toolbarSlot && <div className="flex justify-center">{toolbarSlot}</div>}
        </div>
      </div>
    </div>
  )
}
