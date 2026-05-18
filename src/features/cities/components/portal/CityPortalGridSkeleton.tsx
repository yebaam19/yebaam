/**
 * Skeleton placeholder for the portal grid, used while `getCityPortalData`
 * resolves under the Suspense boundary in `/cities/[slug]/page.tsx`.
 * Pure CSS — no client JS, no fetches.
 */
export function CityPortalGridSkeleton() {
  return (
    <section
      className="grid grid-cols-1 gap-3 lg:grid-cols-[180px_minmax(0,1fr)_180px]"
      aria-hidden="true"
    >
      <div className="flex flex-col gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonTile key={i} />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonTile key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonTile key={i} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonTile key={i} />
        ))}
      </div>
    </section>
  );
}

function SkeletonTile() {
  return (
    <div className="h-[88px] animate-pulse rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
  );
}
