'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import type { ProfileBadge } from '@/features/badges/types/badges.types'
import { acceptBadge, declineBadge } from '@/features/badges/actions/requests.actions'
import { useRouter } from 'next/navigation'

interface Props {
  pending: ProfileBadge[]
}

/** Shown only on the owner's profile when they have unaccepted grants. */
export function PendingBadgeBanner({ pending }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingTx, startTransition] = useTransition()

  if (!pending || pending.length === 0) return null

  const handle = (grantId: string, action: 'accept' | 'decline') => {
    setError(null)
    setBusy(grantId)
    startTransition(async () => {
      const res = await (action === 'accept' ? acceptBadge(grantId) : declineBadge(grantId))
      setBusy(null)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="mx-auto max-w-5xl px-3 pt-3 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/40">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          Tienes {pending.length} insignia{pending.length === 1 ? '' : 's'} pendiente{pending.length === 1 ? '' : 's'} de aceptar
        </p>
        <ul className="mt-2 space-y-2">
          {pending.map((b) => (
            <li key={b.grantId} className="flex flex-wrap items-center gap-3">
              <span className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
                {b.iconUrl ? (
                  <Image src={b.iconUrl} alt="" width={28} height={28} className="size-full object-cover" unoptimized />
                ) : (
                  <span className="text-[10px] font-bold">{b.name.slice(0, 1).toUpperCase()}</span>
                )}
              </span>
              <Link href={`/insignias/${b.slug}` as Route} className="flex-1 text-sm hover:underline">
                {b.name}
              </Link>
              <button
                type="button"
                onClick={() => handle(b.grantId, 'accept')}
                disabled={pendingTx && busy === b.grantId}
                className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Aceptar
              </button>
              <button
                type="button"
                onClick={() => handle(b.grantId, 'decline')}
                disabled={pendingTx && busy === b.grantId}
                className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium dark:border-neutral-700"
              >
                Rechazar
              </button>
            </li>
          ))}
        </ul>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  )
}
