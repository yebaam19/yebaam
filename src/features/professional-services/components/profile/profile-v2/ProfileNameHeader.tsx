import { CheckBadgeIcon, StarIcon } from '@/components/icons/heroicons-shim'
import { ProfessionalService } from '../../../interfaces/professional-service.interfaces'

interface ProfileNameHeaderProps {
  service: ProfessionalService
}

/**
 * "Nombre" + "Franja de Badges": el título del servicio y una tira de insignias.
 * Hoy el modelo sólo expone `isVerified`, así que la franja se compone de:
 * verificado, "Disponible", la categoría y el rating (cuando existen).
 */
export function ProfileNameHeader({ service }: ProfileNameHeaderProps) {
  const { name, user, category, availableForHire, averageRating } = service
  const reviewsCount = service._count.reviews

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl dark:text-neutral-100">{name}</h1>
        {user?.isVerified && (
          <CheckBadgeIcon className="h-6 w-6 shrink-0 text-primary-500" title="Verificado" />
        )}
      </div>

      {/* Franja de Badges */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        {user?.isVerified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 font-medium text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
            <CheckBadgeIcon className="h-4 w-4" />
            Verificado
          </span>
        )}

        {availableForHire && (
          <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Disponible
          </span>
        )}

        {category?.name && (
          <span className="rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
            {category.name}
          </span>
        )}

        {averageRating && (
          <span className="inline-flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
            <StarIcon className="h-4 w-4 text-amber-500" />
            <span className="font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-neutral-400">({reviewsCount})</span>
          </span>
        )}
      </div>
    </div>
  )
}
