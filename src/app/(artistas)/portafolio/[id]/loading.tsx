export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="aspect-video w-full bg-muted animate-pulse rounded-xl mb-6" />
      <div className="h-8 w-64 bg-muted animate-pulse rounded mb-3" />
      <div className="h-4 w-full bg-muted animate-pulse rounded" />
    </main>
  )
}
