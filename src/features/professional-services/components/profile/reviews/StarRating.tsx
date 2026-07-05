import { StarIcon } from '@/components/icons/heroicons-shim'

/**
 * Estrella individual (solo lectura).
 */
export function RatingStar({ filled }: { filled: boolean }) {
  return <StarIcon className={`h-4 w-4 ${filled ? 'text-primary-500' : 'text-neutral-300 dark:text-neutral-600'}`} />
}

/**
 * Fila de 5 estrellas (solo lectura) para mostrar una calificación.
 */
export function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <RatingStar key={star} filled={star <= rating} />
      ))}
    </div>
  )
}
