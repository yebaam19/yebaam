export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="h-64 w-full bg-muted animate-pulse rounded-xl mb-6" />
      <div className="h-8 w-64 bg-muted animate-pulse rounded mb-3" />
      <div className="h-4 w-full bg-muted animate-pulse rounded mb-2" />
      <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
    </main>
  )
}
