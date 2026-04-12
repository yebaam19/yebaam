/**
 * Professional Service Loading Page
 *
 * Skeleton de carga para la página de perfil del servicio profesional.
 */

import {
  BreadcrumbSkeleton,
  ProfileHeaderSkeleton,
  ReviewCardSkeleton,
  Skeleton,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  SkeletonText,
} from '@/components/skeletons'

export default function ServiceProfileLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      {/* Breadcrumb & Actions */}
      <div className="flex items-start justify-between gap-4">
        <BreadcrumbSkeleton />
        <div className="flex gap-2">
          <SkeletonButton />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>

      {/* Header del servicio */}
      <ProfileHeaderSkeleton />

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* About Skeleton */}
          <SkeletonCard />

          {/* Gallery Skeleton */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
            <div className="mb-4 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>

          {/* Reviews Skeleton */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
            <div className="mb-4 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <ReviewCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Card Skeleton */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
            <div className="mb-4 flex items-center gap-3">
              <SkeletonAvatar />
              <div className="flex-1 space-y-2">
                <SkeletonText className="w-32" />
                <SkeletonText className="w-24" />
              </div>
            </div>
            <SkeletonButton className="w-full" />
          </div>

          {/* Contact Card Skeleton */}
          <div className="rounded-2xl bg-primary-50 p-6 dark:bg-primary-900/20">
            <Skeleton className="mb-4 h-6 w-48" />
            <div className="space-y-3">
              <SkeletonButton className="w-full" />
              <SkeletonButton className="w-full" />
              <SkeletonButton className="w-full" />
            </div>
            <div className="mt-4">
              <SkeletonText className="mx-auto w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
