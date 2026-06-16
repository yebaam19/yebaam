import Card, { CardContent } from '../../../components/ui/Card'

export interface ReviewCardData {
  id: number | string
  authorName: string
  rating: number
  comment: string
  createdAt?: string
  productName?: string
  isVerified?: boolean
}

interface ReviewCardProps {
  review: ReviewCardData
}

function formatDate(value?: string) {
  if (!value) return 'Fecha por confirmar'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function renderStars(rating: number) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)))
  return '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating)
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card className="border-stone-200 bg-white shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-green-50)] text-xs font-semibold text-[var(--brand-green-700)]">
              {getInitials(review.authorName)}
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900">
                {review.authorName}
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium text-amber-500" aria-label={`${review.rating} de 5 estrellas`}>
                  {renderStars(review.rating)}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{formatDate(review.createdAt)}</span>
              </div>
            </div>
          </div>

          {review.isVerified && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              Cuenta verificada
            </span>
          )}
        </div>

        {review.productName && (
          <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
            {review.productName}
          </div>
        )}

        <p className="line-clamp-3 text-sm leading-6 text-slate-600">{review.comment}</p>
      </CardContent>
    </Card>
  )
}
