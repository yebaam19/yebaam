import { CheckBadgeIcon, StarIcon } from '@/components/icons/heroicons-shim'

interface ServiceInfoProps {
  name: string
  isVerified?: boolean
  categoryName?: string
  averageRating?: number
  reviewsCount: number
}

/**
 * Información básica del servicio (nombre, categoría, rating)
 */
export function ServiceInfo({ name, isVerified, categoryName, averageRating, reviewsCount }: ServiceInfoProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl dark:text-neutral-100">{name}</h1>
        {isVerified && <CheckBadgeIcon className="h-5 w-5 text-primary-500 sm:h-6 sm:w-6" title="Verificado" />}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        {categoryName && (
          <span className="rounded-full bg-primary-100 px-3 py-1 font-medium text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
            {categoryName}
          </span>
        )}

        {averageRating && (
          <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
            <StarIcon className="h-4 w-4 text-primary-500" />
            <span className="font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-neutral-400">({reviewsCount} reseñas)</span>
          </div>
        )}
      </div>
    </div>
  )
}
