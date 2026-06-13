'use client'

import { TrashIcon } from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'

interface BlogDangerZoneProps {
  blogName: string
  showDeleteConfirm: boolean
  confirmDeleteText: string
  onShowDeleteConfirm: () => void
  onCancelDeleteConfirm: () => void
  onConfirmDeleteTextChange: (value: string) => void
  onDelete: () => void
  isDeleting: boolean
  /** Disables the "open delete confirm" button while other mutations run. */
  disabled?: boolean
}

export const BlogDangerZone = ({
  blogName,
  showDeleteConfirm,
  confirmDeleteText,
  onShowDeleteConfirm,
  onCancelDeleteConfirm,
  onConfirmDeleteTextChange,
  onDelete,
  isDeleting,
  disabled = false,
}: BlogDangerZoneProps) => {
  const t = useTranslations('blogs.editModal')
  const tActions = useTranslations('blogs.actions')

  return (
    <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/30">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
        <TrashIcon className="h-4 w-4" />
        {t('dangerZoneTitle')}
      </h4>
      <p className="mt-1 text-xs text-rose-600/80 dark:text-rose-300/80">
        {t('dangerZoneDescription')}
      </p>
      {!showDeleteConfirm ? (
        <button
          type="button"
          onClick={onShowDeleteConfirm}
          disabled={disabled}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:bg-neutral-900 dark:text-rose-300 dark:hover:bg-rose-950/60"
        >
          <TrashIcon className="h-3.5 w-3.5" />
          {t('deleteButton')}
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-medium text-rose-700 dark:text-rose-300">
            {t.rich('confirmDeleteLabel', {
              name: () => <span className="font-semibold">{blogName}</span>,
            })}
          </label>
          <input
            type="text"
            value={confirmDeleteText}
            onChange={(e) => onConfirmDeleteTextChange(e.target.value)}
            disabled={isDeleting}
            className="w-full rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm text-neutral-900 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-rose-800 dark:bg-neutral-900 dark:text-neutral-100"
            placeholder={blogName}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancelDeleteConfirm}
              disabled={isDeleting}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              {tActions('cancel')}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting || confirmDeleteText.trim() !== blogName}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              {isDeleting ? t('deletingLabel') : t('deletePermanently')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
