import { StarIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'
import { ProfessionalServiceReview } from '../../interfaces/professional-service.interfaces'

interface ServiceReviewsProps {
  reviews: ProfessionalServiceReview[]
  averageRating?: number
  totalReviews: number
}

/**
 * Componente de estrella individual
 */
function RatingStar({ filled }: { filled: boolean }) {
  return <StarIcon className={`h-4 w-4 ${filled ? 'text-primary-500' : 'text-neutral-300 dark:text-neutral-600'}`} />
}

/**
 * Componente de rating con estrellas
 */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <RatingStar key={star} filled={star <= rating} />
      ))}
    </div>
  )
}

/**
 * Formatea fecha relativa
 */
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Hoy'
  } else if (diffDays === 1) {
    return 'Ayer'
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`
  } else {
    const years = Math.floor(diffDays / 365)
    return `Hace ${years} ${years === 1 ? 'año' : 'años'}`
  }
}

/**
 * Tarjeta de reseña individual
 */
function ReviewCard({ review }: { review: ProfessionalServiceReview }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          {review.user.avatarUrl ? (
            <Image
              src={review.user.avatarUrl}
              alt={`${review.user.firstName} ${review.user.lastName}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-neutral-500">
              {review.user.firstName.charAt(0)}
              {review.user.lastName.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="truncate font-medium text-neutral-900 dark:text-neutral-100">
              {review.user.firstName} {review.user.lastName}
            </h4>
            <span className="shrink-0 text-xs text-neutral-500">{formatRelativeDate(review.createdAt)}</span>
          </div>

          <div className="mt-1">
            <StarRating rating={review.rating} />
          </div>

          {review.comment && <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{review.comment}</p>}
        </div>
      </div>
    </div>
  )
}

/**
 * Sección de reseñas del servicio profesional
 */
export function ServiceReviews({ reviews, averageRating, totalReviews }: ServiceReviewsProps) {
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
          <div className="mt-1">
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
