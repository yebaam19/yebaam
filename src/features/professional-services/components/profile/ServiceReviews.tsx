import { StarIcon } from '@/components/icons/heroicons-shim'
import { ProfessionalServiceReview } from '../../interfaces/professional-service.interfaces'
import { ReviewCard } from './reviews/ReviewCard'
import { ReviewForm } from './reviews/ReviewForm'
import { StarRating } from './reviews/StarRating'

interface ServiceReviewsProps {
  serviceId: string
  /** Dueño del servicio — se le oculta el formulario de reseña. */
  ownerId: string
  reviews: ProfessionalServiceReview[]
  averageRating?: number
  totalReviews: number
}

/**
 * Sección de reseñas del servicio profesional: resumen de calificación,
 * formulario para reseñar (visitantes con sesión que no sean el dueño) y la
 * lista de reseñas.
 */
export function ServiceReviews({ serviceId, ownerId, reviews, averageRating, totalReviews }: ServiceReviewsProps) {
  // Distribución de ratings
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((r) => r.rating === rating).length
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
    return { rating, count, percentage }
  })

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
      <h2 className="mb-6 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Reseñas
        <span className="ml-2 text-sm font-normal text-neutral-500">({totalReviews})</span>
      </h2>

      {/* Resumen de rating */}
      <div className="mb-6 flex flex-col gap-6 rounded-xl bg-neutral-50 p-4 sm:flex-row sm:items-center dark:bg-neutral-900">
        {/* Rating promedio */}
        <div className="text-center sm:w-32">
          <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
            {averageRating?.toFixed(1) || '0.0'}
          </div>
          <div className="mt-1 flex justify-center">
            <StarRating rating={Math.round(averageRating || 0)} />
          </div>
          <div className="mt-1 text-sm text-neutral-500">
            {totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'}
          </div>
        </div>

        {/* Distribución */}
        <div className="flex-1 space-y-2">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-2 text-sm">
              <span className="w-3 text-neutral-600 dark:text-neutral-400">{rating}</span>
              <StarIcon className="h-4 w-4 text-primary-500" />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-right text-neutral-500">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Formulario de reseña (oculto para el dueño; login para anónimos) */}
      <ReviewForm serviceId={serviceId} ownerId={ownerId} reviews={reviews} />

      {/* Lista de reseñas */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <p className="text-center text-neutral-500 dark:text-neutral-400">Este servicio aún no tiene reseñas.</p>
      )}
    </div>
  )
}
