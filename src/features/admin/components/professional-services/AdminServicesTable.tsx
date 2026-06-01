import Link from 'next/link'
import type { Route } from 'next'
import { StarIcon } from '@/components/icons/heroicons-shim'
import type { AdminServiceRow } from '@/features/admin/server/professional-services.server'

/**
 * Tabla de supervisión de servicios profesionales para administración.
 * Lista cada perfil con su profesional, categoría, ciudad y rating, más un
 * enlace para abrir el perfil público y revisarlo. Es de solo lectura mientras
 * los datos sean mock (pre-backend).
 */
export function AdminServicesTable({ services }: { services: AdminServiceRow[] }) {
  if (services.length === 0) {
    return <p className="p-6 text-sm text-neutral-500 dark:text-neutral-400">No hay servicios profesionales todavía.</p>
  }

  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
      {services.map((s) => (
        <div key={s.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:gap-4">
          {/* Servicio + profesional */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{s.name}</p>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
              {s.ownerUsername ? `@${s.ownerUsername}` : '—'} · {s.ownerName}
            </p>
          </div>

          {/* Categoría */}
          <div className="shrink-0 lg:w-44">
            {s.categoryName ? (
              <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                {s.categoryName}
              </span>
            ) : (
              <span className="text-xs text-neutral-400">Sin categoría</span>
            )}
          </div>

          {/* Ciudad */}
          <div className="shrink-0 text-xs text-neutral-600 lg:w-28 dark:text-neutral-400">
            {s.cityName ?? '—'}
          </div>

          {/* Rating */}
          <div className="flex shrink-0 items-center gap-1 text-xs text-neutral-600 lg:w-24 dark:text-neutral-400">
            {s.averageRating != null ? (
              <>
                <StarIcon className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  {s.averageRating.toFixed(1)}
                </span>
                <span className="text-neutral-400">({s.reviewsCount})</span>
              </>
            ) : (
              <span className="text-neutral-400">Sin reseñas</span>
            )}
          </div>

          {/* Disponibilidad */}
          <div className="shrink-0 lg:w-28">
            <span
              className={
                s.availableForHire
                  ? 'inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              }
            >
              {s.availableForHire ? 'Disponible' : 'No disponible'}
            </span>
          </div>

          {/* Acción */}
          <div className="shrink-0">
            <Link
              href={`/professional-services/${s.slug}` as Route}
              target="_blank"
              className="inline-flex items-center rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Ver perfil
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
