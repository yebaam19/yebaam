/**
 * SectionHeader Component
 *
 * Header común para todas las secciones
 */

'use client'

import { PlusIcon } from '@heroicons/react/24/outline'

interface SectionHeaderProps {
  title: string
  count?: number
  onAdd?: () => void
  addLabel?: string
  showAdd?: boolean
}

export function SectionHeader({ title, count, onAdd, addLabel = 'Agregar', showAdd = true }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
            {count}
          </span>
        )}
      </div>
      {showAdd && onAdd && (
        <button
          onClick={onAdd}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4" />
          {addLabel}
        </button>
      )}
    </div>
  )
}
