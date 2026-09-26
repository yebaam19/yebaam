export default function FeedTimelineSkeleton() {
  return (
    <div role="status" className="space-y-4" aria-label="Cargando publicaciones">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-xl bg-white p-6 dark:bg-neutral-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-5/6 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-4/6 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
