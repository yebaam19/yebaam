'use client'

/**
 * ArticleHeader Component
 *
 * Displays article metadata including author, title, subtitle,
 * and action buttons for the author
 */

import Avatar from '@/ui/Avatar'
import { Button } from '@/ui/Button'
import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  ChatBubbleLeftIcon,
  ClockIcon,
  EyeIcon,
  HeartIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import { useState } from 'react'
import { Article } from '../interfaces'
import { formatRelativeDate } from '../utils/date-utils'

interface ArticleHeaderProps {
  article: Article
  likeCount: number
  isAuthor?: boolean
  onDelete?: () => void
  isDeleting?: boolean
}

export function ArticleHeader({
  article,
  likeCount,
  isAuthor = false,
  onDelete,
  isDeleting = false,
}: ArticleHeaderProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleConfirmDelete = () => {
    onDelete?.()
    setIsDeleteDialogOpen(false)
  }

  return (
    <div className="relative">
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href={`/users/${article.author.username}`} className="flex cursor-pointer items-center gap-3">
            <Avatar
              src={article.author.avatarUrl}
              initials={article.author.displayName.slice(0, 2).toUpperCase()}
              alt={article.author.displayName}
              className="size-12"
            />
            <div className="flex-1">
              <div className="font-semibold text-neutral-900 hover:underline dark:text-white">
                {article.author.displayName}
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                <span>{formatRelativeDate(article.createdAt)}</span>
                {article.readTime && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-3 w-3" />
                      {article.readTime} min de lectura
                    </div>
                  </>
                )}
              </div>
            </div>
          </Link>
        </div>

        <h1 className="mb-4 text-4xl leading-tight font-bold text-neutral-900 md:text-5xl dark:text-white">
          {article.title}
        </h1>

        {article.subtitle && <p className="mb-6 text-xl text-neutral-500 dark:text-neutral-400">{article.subtitle}</p>}

        {isAuthor && (
          <div className="mb-6 flex items-center gap-3">
            <Link href={`/feed/article/${article.id}/edit`}>
              <Button outline className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <PencilSquareIcon className="h-4 w-4" />
                Editar artículo
              </Button>
            </Link>

            <Button
              outline
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
              disabled={isDeleting}
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <TrashIcon className="h-4 w-4" />
              {isDeleting ? 'Eliminando...' : 'Eliminar artículo'}
            </Button>
          </div>
        )}

        <div className="flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1">
            <EyeIcon className="h-4 w-4" />
            {article._count.views} vistas
          </div>
          <div className="flex items-center gap-1">
            <HeartIcon className="h-4 w-4" />
            {likeCount} me gusta
          </div>
          <div className="flex items-center gap-1">
            <ChatBubbleLeftIcon className="h-4 w-4" />
            {article._count.comments} comentarios
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-800">
            <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">¿Estás seguro?</DialogTitle>
            <Description className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Esta acción no se puede deshacer. El artículo será eliminado permanentemente junto con todos sus
              comentarios y reacciones.
            </Description>
            <div className="mt-4 flex justify-end gap-3">
              <Button outline onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button color="red" onClick={handleConfirmDelete}>
                Eliminar artículo
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}
