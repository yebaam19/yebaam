'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { revokeCityAdmin } from '@/features/admin/actions/city-admins.actions'

interface Props {
  cityId: string
  userId: string
}

export function RevokeAdminButton({ cityId, userId }: Props) {
  const t = useTranslations('admin.ciudades')
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const onClick = () => {
    if (!confirm(t('revokeConfirm'))) return
    startTransition(async () => {
      const res = await revokeCityAdmin({ cityId, userId })
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
      {t('revoke')}
    </button>
  )
}
