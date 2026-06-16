'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container mx-auto px-4 py-8 text-center">
      <p className="text-destructive mb-4">{error.message}</p>
      <button onClick={reset} className="underline">Reintentar</button>
    </main>
  )
}
