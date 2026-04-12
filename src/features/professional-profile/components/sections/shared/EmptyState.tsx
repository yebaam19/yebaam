/**
 * EmptyState Component
 *
 * Estado vacío genérico para las secciones
 */

'use client'

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: React.ElementType
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-800/50',
        className
      )}
    >
      <div className="mb-4 rounded-full bg-neutral-200 p-4 dark:bg-neutral-700">
        <Icon className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
      </div>
      <h3 className="mb-1 font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
