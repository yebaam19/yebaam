import Link from 'next/link'
import { MapPin, Phone, Mail, Globe, Link as LinkIcon, ExternalLink } from 'lucide-react'
import type { BusinessDetail, Review, FAQ } from '../../../types'
import { BusinessWriteReview } from './BusinessWriteReview'
import { ReviewSummary } from './ReviewSummary'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('').slice(0, 2)
}

function renderStars(r: number) {
  const n = Math.max(0, Math.min(5, Math.round(r)))
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

/* ─── InfoTab (address/phone/social) ─────────────────────────── */
interface InfoProps { business: BusinessDetail }

export function BusinessInfoTab({ business }: InfoProps) {
  const facts = [
    { icon: <MapPin size={16} />, label: 'Dirección', value: business.address },
    { icon: <Phone size={16} />, label: 'Teléfono', value: business.phone },
    { icon: <Mail size={16} />, label: 'Email', value: business.email },
    { icon: <Globe size={16} />, label: 'Web', value: business.website, link: business.website },
    { icon: <LinkIcon size={16} />, label: 'Instagram', value: business.instagram, link: business.instagram ? `https://instagram.com/${business.instagram.replace('@', '')}` : undefined },
    { icon: <ExternalLink size={16} />, label: 'Facebook', value: business.facebook, link: business.facebook },
  ].filter((f) => f.value)

  return (
    <div className="space-y-8">
      {/* Useful info grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.label} className="rounded-2xl bg-neutral-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <span className="text-primary-700">{fact.icon}</span>
              {fact.label}
            </div>
            {fact.link ? (
              <a href={fact.link} target="_blank" rel="noreferrer"
                className="mt-1 block text-sm leading-6 text-primary-700 hover:underline">
                {fact.value}
              </a>
            ) : (
              <p className="mt-1 text-sm leading-6 text-neutral-600">{fact.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* FAQs */}
      {(business.faqs ?? []).length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Preguntas frecuentes</h2>
          <ul className="space-y-3">
            {business.faqs!.map((faq) => (
              <FaqItem key={faq.id} faq={faq} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function FaqItem({ faq }: { faq: FAQ }) {
  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="font-semibold text-sm text-neutral-900">{faq.question}</p>
      <p className="mt-1 text-sm leading-6 text-neutral-600">{faq.answer}</p>
    </li>
  )
}

/* ─── Reviews Tab ─────────────────────────────────────────────── */
interface ReviewsProps { reviews: Review[]; avgRating: number; reviewCount: number; isAuthenticated?: boolean; businessId?: string }

export function BusinessReviewsTab({ reviews, avgRating, reviewCount, isAuthenticated, businessId }: ReviewsProps) {
  const visible = reviews.filter((r) => r.is_visible !== false)

  return (
    <section className="space-y-5">
      <ReviewSummary reviews={reviews} avgRating={avgRating} reviewCount={reviewCount} />

      {/* Review cards */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          {visible.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-6 text-center shadow-sm">
              <p className="text-lg font-semibold text-neutral-900">Aún no hay reseñas</p>
              <p className="mt-2 text-sm text-neutral-500">Puedes ser de los primeros en contar tu experiencia.</p>
            </div>
          ) : (
            visible.map((review) => <ReviewCard key={review.id} review={review} />)
          )}
        </div>

        {/* Review sidebar: write form if authenticated, login prompt otherwise */}
        <aside className="xl:sticky xl:top-24 xl:self-start">
          {isAuthenticated && businessId ? (
            <BusinessWriteReview businessId={businessId} />
          ) : (
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Opiniones con cuenta</p>
              <h3 className="mt-2 text-lg font-semibold text-neutral-900">Inicia sesión para escribir una reseña</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Las reseñas se publican desde cuentas registradas para mantener una reputación más confiable.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <Link href={'/login' as never}
                  className="inline-flex items-center justify-center rounded-2xl bg-primary-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-800">
                  Iniciar sesión
                </Link>
                <Link href={'/signup' as never}
                  className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50">
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

function ReviewCard({ review }: { review: Review }) {
  const name = review.profile?.username ?? 'Anónimo'
  const date = review.created_at ? formatDate(review.created_at) : null
  return (
    <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
            {getInitials(name)}
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">{name}</p>
            <div className="mt-0.5 flex items-center gap-2 text-xs">
              <span className="font-medium text-amber-500">{renderStars(review.rating)}</span>
              {date && <><span className="text-neutral-300">·</span><span className="text-neutral-500">{date}</span></>}
            </div>
          </div>
        </div>
      </div>
      {review.comment && (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-600">{review.comment}</p>
      )}
    </div>
  )
}
