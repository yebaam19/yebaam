'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import {
  setCityNewsStatus,
  setCityClassifiedStatus,
  setCityContactMessageStatus,
} from '@/features/admin/actions/cities.actions'

type Kind = 'news' | 'classified' | 'contact'

interface Action {
  label: string
  status: string
  intent?: 'primary' | 'danger' | 'neutral'
}

interface Props {
  kind: Kind
  rowId: string
  actions: Action[]
}

/**
 * Tiny status-change button group shared by all three moderation tables.
 * Each button calls the appropriate server action and refreshes the RSC tree.
 */
export function RowStatusActions({ kind, rowId, actions }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const trigger = (status: string) => {
    startTransition(async () => {
      let res
      if (kind === 'news') {
        res = await setCityNewsStatus({
          newsId: rowId,
          status: status as 'pending' | 'approved' | 'rejected',
        })
      } else if (kind === 'classified') {
        res = await setCityClassifiedStatus({
          classifiedId: rowId,
          status: status as 'open' | 'sold' | 'closed',
        })
      } else {
        res = await setCityContactMessageStatus({
          messageId: rowId,
          status: status as 'new' | 'read' | 'resolved',
        })
      }
      if (res.ok) router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap justify-end gap-1">
      {actions.map((a) => (
        <button
          key={a.status}
          type="button"
          disabled={pending}
          onClick={() => trigger(a.status)}
          className={btnClass(a.intent)}
        >
          {a.label}
        </button>
      ))}
    </div>
  )
}

function btnClass(intent?: 'primary' | 'danger' | 'neutral'): string {
  const base =
    'rounded-md px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50'
  if (intent === 'primary')
    return base + ' bg-primary-600 text-white hover:bg-primary-500'
  if (intent === 'danger')
    return base +
      ' border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-900/20'
  return base +
    ' border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800'
}
