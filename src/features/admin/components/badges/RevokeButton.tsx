'use client'

import { useState, useTransition } from 'react'
import { revokeBadge } from '@/features/admin/actions/badges.actions'
import { useRouter } from 'next/navigation'

export function RevokeButton({ grantId }: { grantId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const reason = prompt('Motivo de la revocación (opcional):') ?? ''
          if (reason === null) return
          startTransition(async () => {
            setError(null)
            const res = await revokeBadge({ grantId, reason: reason.trim() || null })
            if (!res.ok) setError(res.error)
            else router.refresh()
          })
        }}
        className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
      >
        {pending ? 'Revocando…' : 'Revocar'}
      </button>
      {error && <span className="ml-2 text-[10px] text-red-600">{error}</span>}
    </>
  )
}
