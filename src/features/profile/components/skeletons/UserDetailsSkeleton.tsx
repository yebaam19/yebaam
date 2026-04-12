/**
 * UserDetails Skeleton Component
 *
 * Skeleton para el componente UserDetails
 */

import { Skeleton } from '@/components/skeletons/Skeleton'

export function UserDetailsSkeleton() {
  return (
    <div className="h-auto w-full rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
      {/* Header */}
      <div className="mb-3">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
        {/* Bio */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>

      {/* Divider */}
      <div className="my-3 h-px bg-gray-200 dark:bg-gray-700" />

      {/* Details List */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
    </div>
  )
}
