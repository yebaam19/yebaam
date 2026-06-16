import type { Review } from '../../../types'

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 30) return `hace ${days} días`
  if (days < 365) return `hace ${Math.floor(days / 30)} meses`
  return `hace ${Math.floor(days / 365)} años`
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? 'text-amber-400' : 'text-neutral-200'}>★</span>
      ))}
    </div>
  )
}

interface Props {
  reviews: Review[]
  avgRating: number
  reviewCount: number
  isAuthenticated?: boolean
}

export function SchoolReviewsTab({ reviews, avgRating, reviewCount, isAuthenticated }: Props) {
  const visible = reviews.filter((r) => r.is_published !== false)

  return (
    <section className="space-y-5">
      {/* Summary bar */}
      {reviewCount > 0 && (
        <div className="overflow-hidden rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <p className="text-4xl font-black text-neutral-950">{avgRating.toFixed(1)}</p>
              <StarRow rating={Math.round(avgRating)} />
              <p className="mt-1 text-xs text-neutral-500">{reviewCount} reseñas</p>
            </div>
            <p className="text-sm text-neutral-500">
              Calificación promedio de {reviewCount} {reviewCount === 1 ? 'estudiante' : 'estudiantes'} que han compartido su experiencia.
            </p>
          </div>
        </div>
      )}

      {/* Grid: reviews + auth prompt */}
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* Reviews list */}
        <div className="space-y-4">
          {visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-primary-200 bg-white p-8 text-center">
              <p className="text-base font-black text-neutral-950">Sin reseñas aún</p>
              <p className="mt-2 text-sm text-neutral-500">Sé el primero en compartir una experiencia.</p>
            </div>
          ) : (
            visible.map((review) => (
              <article key={review.id} className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-sm font-black text-primary-700">
                      {review.profile?.username?.charAt(0).toUpperCase() ?? 'A'}
                    </div>
                    <div>
                      <p className="font-black text-neutral-950">
                        {review.profile?.username ?? 'Anónimo'}
                      </p>
                      <p className="text-xs text-neutral-400">{relativeDate(review.created_at)}</p>
                    </div>
                  </div>
                  <StarRow rating={review.rating} />
                </div>
                {review.title && <p className="mt-4 font-bold text-neutral-950">{review.title}</p>}
                <p className="mt-2 text-sm leading-6 text-neutral-500">{review.body}</p>
              </article>
            ))
          )}
        </div>

        {/* Auth prompt / community sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {isAuthenticated ? (
            <div className="rounded-xl border border-primary-100 bg-primary-50 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary-700">Comunidad</p>
              <h3 className="mt-2 text-lg font-black text-neutral-950">¡Gracias por ser parte de Yebaam!</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Pronto podrás dejar tu reseña directamente desde aquí. Mientras tanto, comparte tu experiencia con otros estudiantes.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-primary-100 bg-primary-50 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary-700">Comunidad</p>
              <h3 className="mt-2 text-lg font-black text-neutral-950">¿Has tomado clases aquí?</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Inicia sesión para dejar tu reseña y ayudar a otros estudiantes a tomar su decisión.
              </p>
              <div className="mt-4 space-y-3">
                <a href="/login"
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-primary-700 text-sm font-black text-white transition hover:bg-primary-800">
                  Iniciar sesión
                </a>
                <a href="/signup"
                  className="flex h-11 w-full items-center justify-center rounded-xl border border-primary-200 bg-white text-sm font-black text-neutral-700 transition hover:border-primary-700 hover:text-primary-700">
                  Crear cuenta gratis
                </a>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
