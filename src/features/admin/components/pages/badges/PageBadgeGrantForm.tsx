'use client'

import { useState } from 'react'
import type { PageBadgeCatalogItem } from './PageBadgesDialog'

interface Props {
  catalog: PageBadgeCatalogItem[]
  /** Badge ids already active on the page — hidden from the picker. */
  activeBadgeIds: Set<string>
  busy: boolean
  /** Resolves true when the grant landed (the form then resets itself). */
  onGrant: (badgeId: string, reason: string) => Promise<boolean>
}

export function PageBadgeGrantForm({ catalog, activeBadgeIds, busy, onGrant }: Props) {
  const [badgeId, setBadgeId] = useState('')
  const [reason, setReason] = useState('')

  const available = catalog.filter((b) => !activeBadgeIds.has(b.id))

  if (available.length === 0) {
    return (
      <p className="mt-1 text-sm text-neutral-400">
        No quedan insignias del catálogo por asignar.
      </p>
    )
  }

  const handleSubmit = async () => {
    if (!badgeId) return
    const ok = await onGrant(badgeId, reason)
    if (ok) {
      setBadgeId('')
      setReason('')
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <select
        value={badgeId}
        onChange={(e) => setBadgeId(e.target.value)}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      >
        <option value="">Elegir insignia…</option>
        {available.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
            {b.tier ? ` (${b.tier})` : ''}
          </option>
        ))}
      </select>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        placeholder="Motivo (opcional)"
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
      />
      <button
        type="button"
        disabled={busy || !badgeId}
        onClick={() => void handleSubmit()}
        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
      >
        {busy ? 'Asignando…' : 'Asignar insignia'}
      </button>
    </div>
  )
}
