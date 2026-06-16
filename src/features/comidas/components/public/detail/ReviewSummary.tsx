import type { Review } from '../../../types'

function renderStars(r: number) {
  const n = Math.max(0, Math.min(5, Math.round(r)))
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

interface Props {
  reviews: Review[]
  avgRating: number
  reviewCount: number
}

export function ReviewSummary({ reviews, avgRating, reviewCount }: Props) {
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }))

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:gap-8">
        {/* Big score */}
        <div className="text-center sm:min-w-[120px]">
          <p className="text-6xl font-black tracking-tight text-neutral-950">
            {avgRating.toFixed(1)}
          </p>
          <p className="mt-1 text-xl text-amber-500">{renderStars(avgRating)}</p>
          <p className="mt-1 text-sm text-neutral-500">
            {reviewCount} reseña{reviewCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Star distribution bars */}
        <div className="flex-1 space-y-2.5">
          {dist.map(({ star, count }) => {
            const pct = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-4 shrink-0 text-right text-xs font-semibold text-neutral-600">
                  {star}
                </span>
                <span className="text-amber-400 text-xs">★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs text-neutral-500">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {reviewCount === 0 && (
        <div className="border-t border-neutral-100 px-6 py-4">
          <p className="text-sm text-neutral-500">
            Este negocio está construyendo su reputación. Sé el primero en compartir tu experiencia.
          </p>
        </div>
      )}
    </div>
  )
}
