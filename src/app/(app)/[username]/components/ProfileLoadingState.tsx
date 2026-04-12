/**
 * Loading state component for profile page
 */
export function ProfileLoadingState() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {/* Cover photo skeleton */}
          <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
          
          {/* Profile info skeleton */}
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-48 bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
          </div>

          {/* Tabs skeleton */}
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
            ))}
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
              <div className="h-48 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
              <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
              <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
