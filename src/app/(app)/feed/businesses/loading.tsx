/**
 * Businesses Loading Page
 *
 * Skeleton de carga para la página de listado de negocios.
 */

export default function BusinessesLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Hero Skeleton - matches BusinessesHero with rounded-2xl */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 via-cyan-600 to-teal-600 px-6 py-12 md:px-12 md:py-16">
        {/* Background Pattern Skeleton */}
        <div className="absolute inset-0 opacity-10" />

        {/* Content */}
        <div className="relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-4 h-10 w-72 animate-pulse rounded-lg bg-white/20 md:h-12" />
            <div className="mx-auto h-6 w-96 max-w-full animate-pulse rounded-lg bg-white/20" />
            <div className="mx-auto mt-6 h-12 w-48 animate-pulse rounded-lg bg-white/30" />
          </div>

          {/* Feature Cards - 3 columns */}
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-white/20" />
                  <div className="h-5 w-32 animate-pulse rounded bg-white/20" />
                </div>
                <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                <div className="mt-1 h-4 w-3/4 animate-pulse rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs Skeleton - border-bottom style */}
        <div className="mb-6 border-b border-neutral-200 dark:border-neutral-700">
          <nav className="-mb-px flex space-x-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b-2 border-transparent px-1 py-4">
                <div className="h-5 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
            ))}
          </nav>
        </div>

        {/* Filter Bar Skeleton */}
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="h-10 w-64 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-10 w-32 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-10 w-32 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-neutral-800">
              {/* Image */}
              <div className="aspect-video animate-pulse bg-neutral-200 dark:bg-neutral-700" />

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
                  <div className="flex-1">
                    <div className="h-5 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                    <div className="mt-1 h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                  </div>
                </div>
                <div className="mt-3 h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="mt-4 flex items-center justify-between">
                  <div className="h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                  <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
