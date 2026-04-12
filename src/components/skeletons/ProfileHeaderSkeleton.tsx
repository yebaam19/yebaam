/**
 * Profile Header Skeleton
 *
 * Skeleton compartido para headers de perfiles
 */

import { Skeleton, SkeletonAvatar, SkeletonBadge, SkeletonTitle, SkeletonText } from './Skeleton'

export function ProfileHeaderSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-neutral-800">
      {/* Cover */}
      <Skeleton className="h-32 sm:h-40 lg:h-48" />

      {/* Content */}
      <div className="relative px-4 pb-4 sm:px-6">
        {/* Avatar */}
        <div className="absolute -top-12 left-4 sm:-top-16 sm:left-6">
          <SkeletonAvatar className="h-24 w-24 border-4 border-white sm:h-32 sm:w-32 dark:border-neutral-900" />
        </div>

        {/* Info */}
        <div className="ml-0 pt-14 sm:ml-36 sm:pt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* User Info */}
            <div>
              <SkeletonTitle className="mb-2 h-8 w-64" />
              <SkeletonText className="mb-2 w-32" />
              <SkeletonText className="mb-3 w-96" />

              {/* Stats */}
              <div className="mt-3 flex flex-wrap gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-1">
                    <Skeleton className="h-5 w-8" />
                    <SkeletonText className="w-20" />
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
