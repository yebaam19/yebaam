import { ServiceCardSkeleton, Skeleton, SkeletonButton } from '@/components/skeletons'

export default function ProfessionalServicesLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="relative overflow-hidden rounded-2xl bg-feature-services px-6 py-12 md:px-12 md:py-16">
        <div className="absolute inset-0 opacity-10" />
        <div className="relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Skeleton className="mx-auto mb-4 h-10 w-72 bg-white/20 md:h-12" />
            <Skeleton className="mx-auto h-6 w-96 max-w-full bg-white/20" />
            <SkeletonButton className="mx-auto mt-6 h-12 w-56 bg-white/30" />
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg bg-white/20" />
                  <Skeleton className="h-5 w-32 bg-white/20" />
                </div>
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="mt-1 h-4 w-3/4 bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 border-b border-neutral-200 dark:border-neutral-700">
          <nav className="-mb-px flex space-x-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b-2 border-transparent px-1 py-4">
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </nav>
        </div>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <SkeletonButton />
            <SkeletonButton />
            <SkeletonButton />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-48 rounded-lg" />
            <SkeletonButton />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
