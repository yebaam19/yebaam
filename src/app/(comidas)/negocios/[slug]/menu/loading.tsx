export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="h-8 w-32 bg-muted animate-pulse rounded mb-6" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="mb-8">
          <div className="h-6 w-40 bg-muted animate-pulse rounded mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="h-40 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </main>
  )
}
