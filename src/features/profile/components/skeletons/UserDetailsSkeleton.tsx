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
      <Skeleton className="mb-5 h-6 w-24" />

      {/* Details List */}
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-5 h-11 w-full rounded-lg" />
    </div>
  )
}
