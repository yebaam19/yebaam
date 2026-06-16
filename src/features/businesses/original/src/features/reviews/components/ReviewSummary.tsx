import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'

export interface ReviewSummaryProps {
  averageRating: number
  totalReviews: number
  distribution?: {
    stars5?: number
    stars4?: number
    stars3?: number
    stars2?: number
    stars1?: number
  }
}

function percentage(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 100)
}

export default function ReviewSummary({
  averageRating,
  totalReviews,
  distribution = {},
}: ReviewSummaryProps) {
  const rows = [
    { label: '5 estrellas', value: distribution.stars5 ?? 0 },
    { label: '4 estrellas', value: distribution.stars4 ?? 0 },
    { label: '3 estrellas', value: distribution.stars3 ?? 0 },
    { label: '2 estrellas', value: distribution.stars2 ?? 0 },
    { label: '1 estrella', value: distribution.stars1 ?? 0 },
  ]

  const roundedRating = Math.max(0, Math.min(5, averageRating))
  const starLabel =
    totalReviews > 0
      ? `${'★'.repeat(Math.round(roundedRating))}${'☆'.repeat(5 - Math.round(roundedRating))}`
      : 'Sin calificaciones por ahora'
  const reputationNote =
    totalReviews === 0
      ? 'Este negocio todavía no tiene reseñas. Puedes ser de los primeros en contar cómo te fue.'
      : totalReviews < 3
        ? 'Este negocio está empezando a construir su reputación.'
        : 'Reputación construida con opiniones reales de clientes.'

  return (
    <Card className="overflow-hidden border-stone-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl">Reputación del negocio</CardTitle>
        <CardDescription>
          Opiniones reales para entender mejor la experiencia antes de decidir.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-[minmax(0,170px)_minmax(0,1fr)]">
        <div className="rounded-[1.35rem] border border-stone-200 bg-stone-50 p-4 text-center">
          <p className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {averageRating.toFixed(1)}
          </p>
          <p
            className="mt-2 text-sm font-medium text-amber-500"
            aria-label={`${roundedRating} de 5 estrellas`}
          >
            {starLabel}
          </p>
          <p className="mt-3 text-sm font-medium text-slate-700">
            Basado en {totalReviews} reseña{totalReviews === 1 ? '' : 's'}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {reputationNote}
          </p>
        </div>

        <div className="space-y-2">
          {rows.map((row) => {
            const percent = percentage(row.value, totalReviews)

            return (
              <div key={row.label} className="grid grid-cols-[78px_1fr_28px] items-center gap-2.5">
                <span className="text-xs font-medium text-slate-600 sm:text-sm">{row.label}</span>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[var(--brand-green-600)]"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <span className="text-right text-xs font-medium text-slate-500 sm:text-sm">
                  {row.value}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
