'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import {
  setCityComplaintStatus,
  deleteCityComplaint,
} from '@/features/admin/actions/cities.actions'

interface Props {
  complaintId: string
  status: 'new' | 'seen' | 'resolved' | 'rejected'
}

export function ComplaintRowActions({ complaintId, status }: Props) {
  const t = useTranslations('admin.ciudades')
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const setStatus = (s: Props['status']) =>
    startTransition(async () => {
      const res = await setCityComplaintStatus({ complaintId, status: s })
      if (res.ok) router.refresh()
    })

  const onDelete = () => {
    if (!confirm(t('complaintDeleteConfirm'))) return
    startTransition(async () => {
      const res = await deleteCityComplaint({ complaintId })
      if (res.ok) router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap justify-end gap-1 pt-1">
      {status !== 'seen' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus('seen')}
          className="rounded-md border border-neutral-300 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          {t('complaintMarkSeen')}
        </button>
      )}
      {status !== 'resolved' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus('resolved')}
          className="rounded-md bg-primary-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
        >
          {t('complaintMarkResolved')}
        </button>
      )}
      {status !== 'rejected' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus('rejected')}
          className="rounded-md border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-900/20"
        >
          {t('complaintReject')}
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
  )
}
