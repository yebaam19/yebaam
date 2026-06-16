export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="h-9 w-36 bg-muted animate-pulse rounded mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-muted animate-pulse h-72" />
        ))}
      </div>
    </main>
  )
}
