'use client'

import { useTranslations } from 'next-intl'
import { ChatBubbleLeftIcon } from '@/components/icons/heroicons-shim'

interface EmptyCommentsProps {
  message?: string
}

/**
 * Estado vacío para cuando no hay comentarios
 */
export function EmptyComments({ message }: EmptyCommentsProps) {
  const t = useTranslations('feed')
  return (
    <div className="flex flex-col items-center justify-center bg-white py-10 text-center dark:bg-neutral-900">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <ChatBubbleLeftIcon className="h-7 w-7 text-neutral-400 dark:text-neutral-600" />
      </div>
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        {message ?? t('comments.empty')}
      </p>
      <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">{t('comments.emptyHint')}</p>
    </div>
  )
}
