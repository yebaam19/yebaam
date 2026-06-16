export default function MisSeguidosLoading() {
  return (
    <main className="min-h-screen bg-white">
      <section
        className="overflow-hidden px-4 py-12"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgb(22,164,76,0.18) 0%, transparent 70%), rgb(240,252,245)',
        }}
      >
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 h-5 w-40 animate-pulse rounded bg-neutral-200" />
          <div className="mt-2 h-10 w-72 animate-pulse rounded bg-neutral-200" />
          <div className="mt-2 h-5 w-40 animate-pulse rounded bg-neutral-200" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="h-56 animate-pulse bg-neutral-200" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-2/3 animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="h-11 animate-pulse rounded-2xl bg-neutral-200" />
                  <div className="h-11 animate-pulse rounded-2xl bg-neutral-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
