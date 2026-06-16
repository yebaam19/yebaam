function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-neutral-100 ${className}`} />
}

export function StatsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-28" />
        ))}
      </div>
      <Bone className="h-16" />
    </div>
  )
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Bone className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-2/3" />
            <Bone className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-6 max-w-xl">
      <Bone className="h-8 w-48" />
      <div className="space-y-4">
        <Bone className="h-11" />
        <Bone className="h-11" />
        <Bone className="h-24" />
        <Bone className="h-11" />
      </div>
      <Bone className="h-12" />
    </div>
  )
}

export function TimelineSkeleton({ items = 5 }: { items?: number }) {
  return (
    <ol className="relative border-l border-neutral-200 space-y-6">
      {Array.from({ length: items }).map((_, i) => (
        <li key={i} className="ml-6">
          <span className="absolute -left-2 h-4 w-4 animate-pulse rounded-full bg-neutral-100" />
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 space-y-2">
            <Bone className="h-4 w-1/2" />
            <Bone className="h-3 w-1/4" />
          </div>
        </li>
      ))}
    </ol>
  )
}

export function CardGridSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: cards }).map((_, i) => (
        <Bone key={i} className="h-36" />
      ))}
    </div>
  )
}
