import { PORTAL_SHORTCUTS } from '@/features/cities/data/portal-sections';

/**
 * Skeleton placeholder for the flat picture-card portal grid, used while
 * the grid's thumbnails resolve under the Suspense boundary in
 * `/cities/[slug]/page.tsx`. Pure CSS — no client JS, no fetches.
 *
 * The placeholder count is derived from the same `PORTAL_SHORTCUTS` array
 * the live grid uses, so the fallback height matches the post-load height to
 * within a tile and CLS stays at zero.
 */
export function CityPortalGridSkeleton() {
  return (
    <section
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
      aria-hidden="true"
    >
      {PORTAL_SHORTCUTS.map((section) => (
        <SkeletonTile key={section.id} />
      ))}
    </section>
  );
}

function SkeletonTile() {
  return (
    <div className="aspect-[4/3] animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
  );
}
