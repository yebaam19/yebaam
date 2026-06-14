/** Loading placeholder for the group detail page — cover band + a couple of
 *  text bars while `useGroup` resolves. */
export function GroupDetailSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="animate-pulse">
        {/* Cover skeleton */}
        <div className="h-64 bg-neutral-200 dark:bg-neutral-800" />
        {/* Content skeleton */}
        <div className="container mx-auto max-w-5xl px-4 py-6">
          <div className="space-y-4">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
