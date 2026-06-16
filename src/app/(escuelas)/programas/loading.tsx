export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="h-9 w-40 bg-muted animate-pulse rounded mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-56 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    </main>
  )
}
