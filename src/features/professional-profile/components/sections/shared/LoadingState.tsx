/**
 * LoadingState Component
 *
 * Estado de carga para las secciones
 */

'use client'

import { cn } from '@/lib/utils'
import { ArrowPathIcon } from '@/components/icons/heroicons-shim'

interface LoadingStateProps {
  className?: string
  text?: string
}

export function LoadingState({ className, text = 'Cargando...' }: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-neutral-800',
        className
      )}
    >
      <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{text}</p>
    </div>
  )
}
