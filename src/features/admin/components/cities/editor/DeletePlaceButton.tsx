'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { deleteCityPlace } from '@/features/admin/actions/cities.actions'

export function DeletePlaceButton({ placeId }: { placeId: string }) {
  const t = useTranslations('admin.ciudades')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const onClick = () => {
    if (!confirm(t('placeDeleteConfirm'))) return
    startTransition(async () => {
      const res = await deleteCityPlace({ placeId })
      if (res.ok) router.refresh()
    })
  }
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-900/20"
    >
      {t('removeCta')}
    </button>
  )
}
