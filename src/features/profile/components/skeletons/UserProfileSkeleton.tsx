/**
 * UserProfile Skeleton Component
 *
 * Skeleton de alta fidelidad para el componente UserProfile
 * Replica exactamente la estructura visual del perfil
 */

import { Skeleton } from '@/components/skeletons/Skeleton';

export function UserProfileSkeleton() {
  return (
    <div className="w-full bg-white dark:bg-gray-800">
      {/* Cover Photo Skeleton */}
      <div className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-lg">
          <Skeleton className="h-48 w-full sm:h-64 md:h-72 lg:h-80" />
        </div>
      </div>

      {/* Profile Info Section Skeleton */}
      <div>
        <div className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8">
          <div className="relative -mt-12 flex w-full min-w-0 flex-col items-center gap-3 pb-4 sm:-mt-14 lg:-mt-16 lg:flex-row lg:items-end lg:gap-5">
            {/* Avatar Skeleton */}
            <div className="shrink-0 lg:ml-6">
              <Skeleton className="size-28 min-h-28 min-w-28 rounded-full border-4 border-white bg-gray-200 sm:size-36 sm:min-h-36 sm:min-w-36 md:size-40 md:min-h-40 md:min-w-40 lg:size-[150px] lg:min-h-[150px] lg:min-w-[150px] dark:border-gray-800 dark:bg-gray-700" />
            </div>

            {/* Info and Actions Skeleton */}
            <div className="flex w-full min-w-0 flex-col items-center lg:flex-1 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
              {/* User Info Skeleton */}
              <div className="flex w-full min-w-0 flex-col items-center space-y-2 lg:items-start">
                {/* Name */}
                <Skeleton className="h-9 w-64" />
                {/* Username */}
                <Skeleton className="h-5 w-32" />
                {/* Stats */}
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              {/* Action Button Skeleton */}
              <div className="mt-4 flex lg:mt-0 lg:mr-6">
                <Skeleton className="h-10 w-32 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
