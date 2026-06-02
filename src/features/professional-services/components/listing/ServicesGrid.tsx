/**
 * ServicesGrid Component
 *
 * Grid de servicios profesionales con estado de carga y vacío.
 */

'use client'

import { cn } from '@/lib/utils'

import { ProfessionalServiceBasic } from '../../interfaces/professional-service.interfaces'
import { ServiceListCard } from './ServiceListCard'

// ============================================================================
// TYPES
// ============================================================================

interface ServicesGridProps {
  services: ProfessionalServiceBasic[]
  isLoading?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ServicesGrid({ services, isLoading = false, className }: ServicesGridProps) {
  if (isLoading) {
    return <ServicesGridSkeleton className={className} />
  }

  if (services.length === 0) {
    return <ServicesGridEmpty />
  }

  return (
    <div className={cn('grid w-full gap-4 sm:gap-5 lg:gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]', className)}>
      {services.map((service) => (
        <ServiceListCard key={service.id} service={service} />
      ))}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ServicesGridSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid w-full gap-4 sm:gap-5 lg:gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]', className)}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        >
          {/* Image skeleton */}
          <div className="aspect-16/9 bg-neutral-200 dark:bg-neutral-800" />

          {/* Content skeleton */}
          <div className="space-y-3 p-4">
            {/* Title */}
            <div className="h-6 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />

            {/* Description */}
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>

            {/* Location */}
            <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>
              <div className="h-4 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ServicesGridEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
        <svg className="h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">No se encontraron servicios</h3>
      <p className="max-w-md text-neutral-600 dark:text-neutral-400">
        No hay servicios profesionales que coincidan con los filtros seleccionados. Intenta ajustar tu búsqueda o
        eliminar algunos filtros.
      </p>
    </div>
  )
}
