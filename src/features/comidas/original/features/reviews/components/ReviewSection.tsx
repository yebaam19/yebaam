import SectionHeader from '../../../components/shared/SectionHeader'
import ReviewSummary from './ReviewSummary'
import ReviewCard, { type ReviewCardData } from './ReviewCard'
import ReviewForm, { type ReviewFormValues } from './ReviewForm'
import { Link } from 'react-router-dom'

export interface ReviewSectionProps {
  title?: string
  description?: string
  averageRating: number
  totalReviews: number
  distribution?: {
    stars5?: number
    stars4?: number
    stars3?: number
    stars2?: number
    stars1?: number
  }
  reviews: ReviewCardData[]
  onSubmitReview?: (values: ReviewFormValues) => void
  submitLoading?: boolean
  canSubmitReview?: boolean
  currentUserName?: string
}

export default function ReviewSection({
  title = 'Reseñas de la comunidad',
  description = 'Experiencias reales para medir confianza, atención y consistencia.',
  averageRating,
  totalReviews,
  distribution,
  reviews,
  onSubmitReview,
  submitLoading = false,
  canSubmitReview = false,
  currentUserName,
}: ReviewSectionProps) {
  const scrollToReviewForm = () => {
    document.getElementById('review-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <section className="space-y-5">
      <SectionHeader
        eyebrow="Reseñas"
        title={title}
        description={description}
        actionLabel={canSubmitReview ? 'Escribir reseña' : undefined}
        onAction={canSubmitReview ? scrollToReviewForm : undefined}
      />

      <ReviewSummary
        averageRating={averageRating}
        totalReviews={totalReviews}
        distribution={distribution}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Aún no hay reseñas
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Este negocio está empezando a construir su reputación. Puedes ser de los primeros en contar tu experiencia.
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          {canSubmitReview ? (
            <div id="review-form" className="space-y-3">
              {currentUserName ? (
                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Estás publicando como{' '}
                  <span className="font-semibold text-slate-900">{currentUserName}</span>.
                </div>
              ) : null}
              <ReviewForm
                onSubmit={onSubmitReview}
                loading={submitLoading}
              />
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-green-700)]">
                Opiniones con cuenta
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                Inicia sesión para escribir una reseña
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Las reseñas se publican desde cuentas registradas para mantener una reputación más confiable.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-[var(--brand-green-600)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-green-700)] focus:outline-none focus:ring-2 focus:ring-[rgba(15,95,47,0.2)] focus:ring-offset-2"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[rgba(15,95,47,0.14)] focus:ring-offset-2"
                >
                  Crear cuenta
                </Link>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Comparte una experiencia concreta para ayudar a otros a elegir mejor.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
