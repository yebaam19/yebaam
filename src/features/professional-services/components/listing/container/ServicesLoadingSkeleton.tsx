export function ServicesLoadingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
        >
          <div className="aspect-16/9 mb-4 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
          <div className="mb-2 h-5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="mb-4 h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      ))}
    </div>
  )
}
