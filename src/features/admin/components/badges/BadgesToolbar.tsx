'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { Route } from 'next'
import { useTransition } from 'react'
import { BADGE_CATEGORY_OPTIONS } from '@/features/badges/lib/badgeTaxonomy'

interface Props {
  search: string
  slot: '' | 'insignia' | 'badge' | string
  category: string
  includeDeleted: boolean
}

const SLOT_OPTIONS: Array<{ value: '' | 'insignia' | 'badge'; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'insignia', label: 'Insignias' },
  { value: 'badge', label: 'Badges' },
]

const CATEGORY_OPTIONS = [
  { value: '', label: 'Categoría' },
  ...BADGE_CATEGORY_OPTIONS,
]

export function BadgesToolbar({ search, slot, category, includeDeleted }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [pending, startTransition] = useTransition()

  const push = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(sp?.toString() ?? '')
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') params.delete(k)
      else params.set(k, v)
    }
    params.delete('page')
    const qs = params.toString()
    startTransition(() => router.push((qs ? `/admin/badges?${qs}` : '/admin/badges') as Route))
  }

  return (
    <div className="flex flex-col gap-3 border-b border-neutral-200 p-3 sm:flex-row sm:items-center dark:border-neutral-800">
      <input
        type="search"
        defaultValue={search}
        placeholder="Buscar por nombre o slug…"
        onKeyDown={(e) => {
          if (e.key === 'Enter') push({ q: (e.target as HTMLInputElement).value.trim() })
        }}
        className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        disabled={pending}
      />
      <div className="flex flex-wrap items-center gap-1">
        {SLOT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={pending}
            onClick={() => push({ slot: opt.value || null })}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              slot === opt.value
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <select
        value={category}
        onChange={(e) => push({ category: e.target.value || null })}
        disabled={pending}
        className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-950"
      >
        {CATEGORY_OPTIONS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
        <input
          type="checkbox"
          checked={includeDeleted}
          onChange={(e) => push({ includeDeleted: e.target.checked ? '1' : null })}
          disabled={pending}
        />
        Incluir eliminadas
      </label>
    </div>
  )
}
