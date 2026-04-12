/**
 * Profile Sidebar Skeleton Component
 *
 * Skeleton para la sidebar de navegación del perfil
 */

import { Skeleton } from '@/components/skeletons/Skeleton'

export function ProfileSidebarSkeleton() {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
      <div className="space-y-3">
        {/* Title */}
        <Skeleton className="h-5 w-32 px-3" />

        {/* Navigation Items */}
        <nav className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-20" />
              </div>
              {i === 2 && <Skeleton className="h-5 w-8 rounded-full" />}
            </div>
          ))}
        </nav>

        {/* Info Card */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <Skeleton className="mb-2 h-4 w-24" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      </div>
    </div>
  )
}
