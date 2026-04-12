/**
 * Business Loading Page
 *
 * Skeleton de carga para la página de perfil del negocio.
 */

export default function BusinessProfileLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Breadcrumb Skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-neutral-800">
          {/* Cover */}
          <div className="h-48 animate-pulse bg-neutral-200 sm:h-64 dark:bg-neutral-700" />

          {/* Profile Info */}
          <div className="relative px-4 pb-6 sm:px-6">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4 sm:-mt-20">
              <div className="h-28 w-28 animate-pulse rounded-xl border-4 border-white bg-neutral-200 sm:h-36 sm:w-36 dark:border-neutral-800 dark:bg-neutral-700" />
            </div>

            {/* Title */}
            <div className="mb-4">
              <div className="h-8 w-64 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="mt-2 flex gap-2">
                <div className="h-6 w-24 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-6 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                  <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Main Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* About Skeleton */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-6 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-4 w-4/6 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
            </div>

            {/* Gallery Skeleton */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-6 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
                ))}
              </div>
            </div>

            {/* Reviews Skeleton */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-6 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
                      <div className="flex-1">
                        <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                        <div className="mt-1 h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Card Skeleton */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-6 w-28 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
                <div className="flex-1">
                  <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                  <div className="mt-1 h-3 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                </div>
              </div>
            </div>

            {/* Hours Skeleton */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-6 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                    <div className="h-4 w-28 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
