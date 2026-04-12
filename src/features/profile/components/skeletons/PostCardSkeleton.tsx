/**
 * Post Card Skeleton Component
 *
 * Skeleton para tarjetas de publicaciones
 */

import { Skeleton } from '@/components/skeletons/Skeleton'

export function PostCardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-6 rounded" />
      </div>

      {/* Content */}
      <div className="mb-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Media */}
      <Skeleton className="mb-4 h-80 w-full rounded-lg" />

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-gray-200 pt-3 dark:border-gray-700">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PostListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}
