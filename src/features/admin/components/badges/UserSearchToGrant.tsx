'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { grantBadge } from '@/features/admin/actions/badges.actions'
import { lookupUserAction } from '@/features/admin/actions/badges-user-lookup.actions'
import type { AdminUserLookup } from '@/features/admin/types/badges.types'

interface Props {
  badgeId: string
  badgeSlug: string
  badgeName: string
  /** Mirrors badges.evidence_required — direct grants then demand a written reason. */
  evidenceRequired?: boolean
}

export function UserSearchToGrant({ badgeId, badgeSlug, badgeName, evidenceRequired = false }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdminUserLookup[]>([])
  const [selected, setSelected] = useState<AdminUserLookup | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const searchTimer = useRef<number | null>(null)

  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    searchTimer.current = window.setTimeout(async () => {
      const out = await lookupUserAction(query)
      setResults(out)
    }, 250)
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current)
    }
  }, [query])

  const handleGrant = () => {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      const res = await grantBadge({ badgeId, userId: selected.id, reason: reason.trim() || null })
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.push(`/admin/badges/${badgeSlug}` as Route)
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Buscar usuario para asignar <strong>{badgeName}</strong>.
      </p>
      {evidenceRequired && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Esta insignia certifica una credencial. Verifica el diploma u otro soporte antes de
          asignarla y <strong>explica en el motivo cómo la verificaste</strong> (obligatorio).
        </p>
      )}
      <input
        autoFocus
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setSelected(null)
        }}
        placeholder="Username, email o UUID…"
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      {!selected && results.length > 0 && (
        <ul className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
          {results.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => setSelected(u)}
                className="flex w-full items-center gap-3 border-b border-neutral-100 px-3 py-2 text-left hover:bg-neutral-50 last:border-0 dark:border-neutral-800 dark:hover:bg-neutral-900"
              >
                {u.avatarUrl ? (
                  <Image src={u.avatarUrl} alt="" width={32} height={32} className="size-8 rounded-full object-cover" unoptimized />
                ) : (
                  <span className="size-8 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                )}
                <span>
                  <span className="block text-sm font-medium">{u.displayName}</span>
                  <span className="block text-xs text-neutral-500">@{u.username}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <div className="rounded-md border border-primary-200 bg-primary-50 p-3 dark:border-primary-900 dark:bg-primary-950/30">
          <div className="flex items-center gap-3">
            {selected.avatarUrl ? (
              <Image src={selected.avatarUrl} alt="" width={40} height={40} className="size-10 rounded-full object-cover" unoptimized />
            ) : (
              <span className="size-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            )}
            <div>
              <p className="text-sm font-semibold">{selected.displayName}</p>
              <p className="text-xs text-neutral-500">@{selected.username}</p>
            </div>
            <button
              type="button"
              className="ml-auto text-xs text-neutral-500 hover:underline"
              onClick={() => setSelected(null)}
            >
              Cambiar
            </button>
          </div>
          <div className="mt-3">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Motivo {evidenceRequired ? '(obligatorio: cómo verificaste la credencial)' : '(opcional)'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleGrant}
            disabled={pending || (evidenceRequired && !reason.trim())}
            className="mt-3 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
          >
            {pending ? 'Asignando…' : 'Asignar insignia'}
          </button>
        </div>
      )}
    </div>
  )
}
