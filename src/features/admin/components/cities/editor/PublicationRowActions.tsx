'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import {
  deleteCityPublication,
  togglePublicationPinned,
} from '@/features/admin/actions/city-media.actions'

interface Props {
  publicationId: string
  isPinned: boolean
}

export function PublicationRowActions({ publicationId, isPinned }: Props) {
  const t = useTranslations('admin.ciudades')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const onPin = () =>
    startTransition(async () => {
      const res = await togglePublicationPinned({ publicationId, isPinned: !isPinned })
      if (res.ok) router.refresh()
    })
  const onDelete = () => {
    if (!confirm(t('publicationDeleteConfirm'))) return
    startTransition(async () => {
      const res = await deleteCityPublication({ publicationId })
      if (res.ok) router.refresh()
    })
  }
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={onPin}
        className="rounded-md border border-neutral-300 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
      >
        {isPinned ? t('publicationUnpin') : t('publicationPinShort')}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onDelete}
        className="rounded-md border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-900/20"
      >
        {t('removeCta')}
      </button>
    </div>
  )
}
