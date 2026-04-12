/**
 * Service Card Skeleton
 *
 * Skeleton para tarjetas de servicios profesionales
 */

import { Skeleton, SkeletonAvatar, SkeletonText, SkeletonImage, SkeletonBadge } from './Skeleton'

export function ServiceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-neutral-800">
      {/* Image */}
      <SkeletonImage className="h-48" />

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <Skeleton className="h-6 w-48" />
          <SkeletonBadge className="h-6 w-16" />
        </div>

        {/* Description */}
        <div className="mb-4 space-y-2">
          <SkeletonText className="w-full" />
          <SkeletonText className="w-3/4" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Owner */}
          <div className="flex items-center gap-2">
            <SkeletonAvatar className="h-8 w-8" />
            <SkeletonText className="w-24" />
          </div>

          {/* Price */}
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  )
}
