/**
 * Suspense fallback for the city detail right rail. Approximates the height
 * of a stats card + trending list so the rest of the page doesn't reflow
 * once the real content streams in.
 */
export function CityPortalSidebarSkeleton() {
  return (
    <aside aria-hidden="true" className="space-y-4">
      <div className="h-[180px] animate-pulse rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/70" />
      <div className="h-[280px] animate-pulse rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/70" />
    </aside>
  );
}
