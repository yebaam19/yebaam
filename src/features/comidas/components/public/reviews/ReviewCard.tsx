export interface ReviewCardData {
  id: string
  authorName: string
  rating: number
  comment: string
  createdAt?: string
  productName?: string
  isVerified?: boolean
}

function formatDate(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
}

/** SVG star — fully filled, half-filled, or empty based on fractional rating. */
function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={['h-4 w-4', className].filter(Boolean).join(' ')}
    >
      <path
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.5}
        className={filled ? 'text-amber-400' : 'text-neutral-300'}
      />
    </svg>
  )
}

function StarRating({ rating }: { rating: number }) {
  const safe = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${safe} de 5 estrellas`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} filled={i < safe} />
      ))}
    </div>
  )
}

/** Color palette for author avatars — deterministic from name */
const AVATAR_COLORS = [
  'bg-primary-100 text-primary-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-violet-100 text-violet-800',
  'bg-sky-100 text-sky-800',
]

function pickAvatarColor(name: string) {
  const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!
}

export function ReviewCard({ review }: { review: ReviewCardData }) {
  const initials = getInitials(review.authorName)
  const avatarColor = pickAvatarColor(review.authorName)
  const date = formatDate(review.createdAt)

  return (
    <article className="overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-neutral-950/5 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar — 44px, colorful */}
        <div
          className={[
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            avatarColor,
          ].join(' ')}
          aria-hidden="true"
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-neutral-900">
              {review.authorName}
            </h3>
            {review.isVerified && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                ✓ Verificada
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-2">
            <StarRating rating={review.rating} />
            {date && (
              <span className="text-xs text-neutral-400">{date}</span>
            )}
          </div>
        </div>
      </div>

      {/* Product tag */}
      {review.productName && (
        <div className="mt-3">
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
            {review.productName}
          </span>
        </div>
      )}

      {/* Comment */}
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-600">
        {review.comment}
      </p>
    </article>
  )
}
