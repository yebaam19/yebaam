/**
 * Review Card Skeleton
 *
 * Skeleton para tarjetas de reseñas
 */

import { SkeletonAvatar, SkeletonText, SkeletonParagraph } from './Skeleton'

export function ReviewCardSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
      <div className="flex gap-3">
        <SkeletonAvatar />
        <div className="flex-1 space-y-1">
          <SkeletonText className="w-24" />
          <SkeletonText className="w-32" />
        </div>
      </div>
      <div className="mt-3">
        <SkeletonParagraph lines={2} />
      </div>
    </div>
  )
}
