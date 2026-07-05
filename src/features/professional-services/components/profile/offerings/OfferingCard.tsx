'use client'

import { PencilIcon, TrashIcon } from '@/components/icons/heroicons-shim'
import type { ServiceOffering } from '../../../server/offerings.server'

/** Precio "Desde" en formato colombiano ($ 1.500.000, sin decimales). */
const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

interface OfferingCardProps {
  offering: ServiceOffering
  isOwner: boolean
  /** Deshabilita el botón de eliminar mientras el delete está en vuelo. */
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}

/** Tarjeta de un sub-servicio: título, descripción y precio "Desde" opcional. */
export function OfferingCard({ offering, isOwner, deleting, onEdit, onDelete }: OfferingCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium break-words text-neutral-900 dark:text-neutral-100">
            {offering.title}
          </h3>
          {offering.description && (
            <p className="mt-1 text-sm break-words whitespace-pre-line text-neutral-600 dark:text-neutral-400">
              {offering.description}
            </p>
          )}
        </div>

        {isOwner && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Editar ${offering.title}`}
              title="Editar"
              className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              aria-label={`Eliminar ${offering.title}`}
              title="Eliminar"
              className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {offering.priceFrom !== null && (
        <p className="mt-2 text-sm font-semibold text-primary-600 dark:text-primary-400">
          Desde {priceFormatter.format(offering.priceFrom)}
        </p>
      )}
    </div>
  )
}
