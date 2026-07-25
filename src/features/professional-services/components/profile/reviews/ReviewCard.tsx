import Image from 'next/image'

import { getUserDisplayName, getUserInitials } from '@/lib/user-helpers'
import { ProfessionalServiceReview } from '../../../interfaces/professional-service.interfaces'
import { StarRating } from './StarRating'

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
export function ReviewCard({ review }: { review: ProfessionalServiceReview }) {
  const displayName = getUserDisplayName(review.user)

  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          {review.user.avatarUrl ? (
            <Image src={review.user.avatarUrl} alt={displayName} fill sizes="40px" className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-neutral-500">
              {getUserInitials(displayName)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="truncate font-medium text-neutral-900 dark:text-neutral-100">{displayName}</h4>
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
