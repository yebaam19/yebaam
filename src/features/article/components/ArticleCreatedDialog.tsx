'use client'

/**
 * ArticleCreatedDialog Component
 *
 * Success dialog shown after creating a new article.
 * Allows copying article ID and URL, and navigating to the article.
 * Adapted from legacy ArticleCreatedDialog.tsx component.
 */

import { Button } from '@/ui/Button'
import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { ArrowTopRightOnSquareIcon, CheckIcon, ClipboardDocumentIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface ArticleCreatedDialogProps {
  isOpen: boolean
  onClose: () => void
  article: {
    id: string
    title: string
  } | null
}

export function ArticleCreatedDialog({ isOpen, onClose, article }: ArticleCreatedDialogProps) {
  const [copiedId, setCopiedId] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [fullUrl, setFullUrl] = useState('')

  useEffect(() => {
    if (article && typeof window !== 'undefined') {
      setFullUrl(`${window.location.origin}/feed/article/${article.id}`)
    }
  }, [article])

  const handleCopyId = useCallback(async () => {
    if (!article) return
    try {
      await navigator.clipboard.writeText(article.id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    } catch (error) {
      console.error('Failed to copy ID:', error)
    }
  }, [article])

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }, [fullUrl])

  if (!article) return null

  const articleUrl = `/feed/article/${article.id}`

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      {/* Dialog container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-800">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
                ¡Artículo publicado!
              </DialogTitle>
              <Description className="text-sm text-neutral-500 dark:text-neutral-400">
                &quot;{article.title.length > 40 ? `${article.title.slice(0, 40)}...` : article.title}&quot;
              </Description>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {/* Article ID */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                ID del artículo
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={article.id}
                  readOnly
                  className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-sm text-neutral-600 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                />
                <Button outline onClick={handleCopyId} className="shrink-0 p-2">
                  {copiedId ? (
                    <CheckIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Article URL */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                URL del artículo
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={fullUrl}
                  readOnly
                  className="flex-1 truncate rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                />
                <Button outline onClick={handleCopyUrl} className="shrink-0 p-2">
                  {copiedUrl ? (
                    <CheckIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-between gap-3">
            <Button outline onClick={onClose}>
              Cerrar
            </Button>
            <Link href={articleUrl}>
              <Button color="primary" className="gap-2">
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                Ver artículo
              </Button>
            </Link>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
