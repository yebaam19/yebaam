export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="h-64 w-full bg-muted animate-pulse rounded-xl mb-6" />
      <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
      <div className="h-4 w-full bg-muted animate-pulse rounded mb-2" />
      <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
    </main>
  )
}
