'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import type { BadgeRequestRow } from '@/features/admin/types/badges.types'
import { RequestReviewDialog } from './RequestReviewDialog'
import { withAdminView } from '@/lib/auth/admin-view'

export function RequestsQueue({ requests }: { requests: BadgeRequestRow[] }) {
  const [open, setOpen] = useState<BadgeRequestRow | null>(null)

  if (requests.length === 0) {
    return (
      <p className="px-3 py-10 text-center text-sm text-neutral-500">
        No hay solicitudes pendientes.
      </p>
    )
  }

  return (
    <>
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {requests.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              {r.avatarUrl ? (
                <Image src={r.avatarUrl} alt="" width={40} height={40} className="size-10 rounded-full object-cover" unoptimized />
              ) : (
                <span className="size-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {r.username ? (
                    <Link
                      href={withAdminView(`/${r.username}`) as Route}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {r.displayName ?? r.username}
                    </Link>
                  ) : (
                    r.displayName ?? r.userId.slice(0, 8)
                  )}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  solicita {r.badgeName} · {new Date(r.createdAt).toLocaleDateString('es-ES')}
                </p>
                {r.reason && <p className="mt-0.5 truncate text-xs text-neutral-600 dark:text-neutral-400">&ldquo;{r.reason}&rdquo;</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {r.supportingCfImageIds.length > 0 ? (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] dark:bg-neutral-800">
                  {r.supportingCfImageIds.length} doc
                </span>
              ) : (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    r.badgeEvidenceRequired
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                      : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                  }`}
                >
                  0 doc{r.badgeEvidenceRequired ? ' ⚠' : ''}
                </span>
              )}
              <button
                type="button"
                onClick={() => setOpen(r)}
                className="rounded-md bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-500"
              >
                Revisar
              </button>
            </div>
          </li>
        ))}
      </ul>
      {open && <RequestReviewDialog request={open} open onClose={() => setOpen(null)} />}
    </>
  )
}
