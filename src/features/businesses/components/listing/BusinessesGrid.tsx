'use client'

/**
 * BusinessesGrid Component
 *
 * Grid de negocios con estado de carga y vacío.
 */

import { PlusIcon } from '@/components/icons/heroicons-shim'
import { BusinessBasic } from '../../interfaces/business.interfaces'
import { BusinessListCard } from './BusinessListCard'

interface BusinessesGridProps {
  businesses: BusinessBasic[]
  isLoading?: boolean
  emptyMessage?: string
  onCreateClick?: () => void
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl bg-white shadow-sm dark:bg-neutral-800">
      <div className="aspect-video bg-neutral-200 dark:bg-neutral-700" />
      <div className="p-4">
        <div className="mb-2 flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
          <div className="flex-1">
            <div className="mb-1 h-5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
        <div className="mb-3 space-y-2">
          <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-3 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
    </div>
  )
}

export function BusinessesGrid({
  businesses,
  isLoading,
  emptyMessage = 'No hay negocios disponibles',
  onCreateClick,
}: BusinessesGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-neutral-50 py-16 text-center dark:bg-neutral-800/50">
        <div className="mb-4 rounded-full bg-neutral-100 p-4 dark:bg-neutral-700">
          <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400">{emptyMessage}</p>
        {onCreateClick && (
          <button
            onClick={onCreateClick}
            className="mt-4 flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4" />
            Crear mi primer negocio
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {businesses.map((business) => (
        <BusinessListCard key={business.id} business={business} />
      ))}
    </div>
  )
}
