'use client'

import Link from 'next/link'
import { ReviewSummary } from '../detail/ReviewSummary'
import { ReviewCard, type ReviewCardData } from './ReviewCard'
import { ReviewForm, type ReviewFormValues } from './ReviewForm'

export interface ReviewSectionProps {
  title?: string
  description?: string
  averageRating: number
  totalReviews: number
  reviews: ReviewCardData[]
  onSubmitReview?: (values: ReviewFormValues) => void
  submitLoading?: boolean
  canSubmitReview?: boolean
  currentUserName?: string
}

export function ReviewSection({
  title = 'Reseñas de la comunidad',
  description = 'Experiencias reales para medir confianza, atención y consistencia.',
  averageRating,
  totalReviews,
  reviews,
  onSubmitReview,
  submitLoading = false,
  canSubmitReview = false,
  currentUserName,
}: ReviewSectionProps) {
  function scrollToForm() {
    document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Reseñas</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">{title}</h2>
          {description && <p className="mt-1 text-sm text-neutral-600">{description}</p>}
        </div>
        {canSubmitReview && (
          <button
            type="button"
            onClick={scrollToForm}
            className="shrink-0 rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Escribir reseña
          </button>
        )}
      </div>

      <ReviewSummary
        reviews={reviews as never}
        avgRating={averageRating}
        reviewCount={totalReviews}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-white p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900">Aún no hay reseñas</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Este negocio está empezando a construir su reputación. Puedes ser de los primeros en contar tu experiencia.
              </p>
            </div>
          ) : (
            reviews.map((review) => <ReviewCard key={review.id} review={review} />)
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          {canSubmitReview ? (
            <div id="review-form" className="space-y-3">
              {currentUserName && (
                <div className="rounded-[1.25rem] border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                  Publicando como <span className="font-semibold text-neutral-900">{currentUserName}</span>.
                </div>
              )}
              <ReviewForm onSubmit={onSubmitReview} loading={submitLoading} />
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
                Opiniones con cuenta
              </p>
              <h3 className="mt-2 text-lg font-semibold text-neutral-900">
                Inicia sesión para escribir una reseña
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Las reseñas se publican desde cuentas registradas para mantener una reputación más confiable.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-primary-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-800"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50"
                >
                  Crear cuenta
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
