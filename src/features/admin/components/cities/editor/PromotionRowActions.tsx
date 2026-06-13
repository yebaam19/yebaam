'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import {
  setCityPromotionStatus,
  deleteCityPromotion,
} from '@/features/admin/actions/city-promotions.actions'

interface Props {
  promotionId: string
  status: 'active' | 'expired' | 'removed'
}

export function PromotionRowActions({ promotionId, status }: Props) {
  const t = useTranslations('admin.ciudades')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(false)

  const setStatus = (s: 'active' | 'expired' | 'removed') =>
    startTransition(async () => {
      setError(false)
      const res = await setCityPromotionStatus({ promotionId, status: s })
      if (res.ok) router.refresh()
      else setError(true)
    })

  const onDelete = () => {
    if (!confirm(t('promotionDeleteConfirm'))) return
    startTransition(async () => {
      setError(false)
      const res = await deleteCityPromotion({ promotionId })
      if (res.ok) router.refresh()
      else setError(true)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
    <div className="flex flex-wrap justify-end gap-1">
      {status !== 'active' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus('active')}
          className="rounded-md bg-primary-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
        >
          {t('promotionActivate')}
        </button>
      )}
      {status !== 'expired' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus('expired')}
          className="rounded-md border border-neutral-300 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          {t('promotionExpire')}
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={onDelete}
        className="rounded-md border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-900/20"
      >
        {t('removeCta')}
      </button>
    </div>
      {error && (
        <span className="text-[11px] text-red-600 dark:text-red-400">{t('actionError')}</span>
      )}
    </div>
  )
}
