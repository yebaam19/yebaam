import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Star, MapPin, MessageCircle, Phone, Globe } from 'lucide-react'
import type { BusinessDetail } from '../../../types'
import { BusinessEngagementBar } from './BusinessEngagementBar'
import { MobileFollowButton } from './MobileFollowButton'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

export function cfImageUrl(id: string | null) {
  if (!id || !CF_HASH) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/public`
}

function sanitizeWhatsApp(v: string) { return v.replace(/[^\d]/g, '') }

export interface EngagementProps {
  isAuthenticated: boolean
  isFollowing?: boolean
  isLiked?: boolean
  isCustomer?: boolean
  followersCount?: number
  likesCount?: number
  customersCount?: number
}

interface Props {
  business: BusinessDetail
  engagement?: EngagementProps
  isAdmin?: boolean
}

export function BusinessHero({ business, engagement, isAdmin }: Props) {
  const coverUrl = cfImageUrl(business.profile_cf_image_id)
  const rating = Number(business.avg_rating ?? 0)
  const reviews = business.review_count ?? 0

  const whatsappUrl = business.whatsapp
    ? `https://wa.me/${sanitizeWhatsApp(business.whatsapp)}?text=${encodeURIComponent(`Hola, quiero pedir en ${business.name}.`)}`
    : null

  return (
    <section className="overflow-hidden rounded-4xl border border-neutral-200 bg-white shadow-sm">
      {/* Cover */}
      <div className="relative h-70 sm:h-90 overflow-hidden bg-primary-50">
        {coverUrl ? (
          <Image src={coverUrl} alt={business.name} fill priority className="object-cover" sizes="100vw" />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: 'radial-gradient(circle at 30% 50%, rgba(22,164,76,0.18) 0%, transparent 60%), rgb(240,252,245)' }}
          />
        )}
        <div className="absolute inset-0 bg-linear-to-b from-white/10 via-transparent to-neutral-950/35" />

        {/* Back link */}
        <Link
          href={'/negocios' as never}
          className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-neutral-700 backdrop-blur-sm transition hover:bg-white"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Negocios
        </Link>

        {/* Quick WhatsApp action */}
        {whatsappUrl && (
          <div className="absolute right-4 top-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold text-neutral-700 backdrop-blur-sm transition hover:bg-white"
            >
              <MessageCircle size={14} aria-hidden="true" />
              Pedir ahora
            </a>
          </div>
        )}
      </div>

      {/* Identity bar */}
      <div className="relative bg-white px-4 pb-5 sm:px-6 lg:px-8">
        <div className="-mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-end gap-4">
            {/* Profile circle */}
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-primary-50 shadow-xl">
              {coverUrl ? (
                <Image src={coverUrl} alt={business.name} width={112} height={112} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary-700 text-2xl font-black text-white">
                  {(business.name ?? '').slice(0, 2).toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="pb-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                {business.category}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                  {business.name}
                </h1>
                {business.is_verified && (
                  <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-800">
                    ✓ Verificado
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CTA buttons desktop */}
          <div className="hidden pb-2 sm:flex flex-wrap gap-2">
            {isAdmin && (
              <Link
                href={`/negocios/admin/${business.id}` as never}
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                Administrar
              </Link>
            )}
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800">
                <MessageCircle size={15} aria-hidden="true" />
                WhatsApp
              </a>
            )}
            {business.phone && !business.whatsapp && (
              <a href={`tel:${business.phone}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50">
                <Phone size={15} aria-hidden="true" />
                Llamar
              </a>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
          {reviews > 0 && (
            <span className="flex items-center gap-1 font-medium text-neutral-700">
              <Star size={14} className="text-secondary-700" aria-hidden="true" />
              {rating.toFixed(1)} · {reviews} reseña{reviews !== 1 ? 's' : ''}
            </span>
          )}
          {business.city && (
            <span className="flex items-center gap-1">
              <MapPin size={13} aria-hidden="true" />
              {business.city}
            </span>
          )}
          {business.address && <span>{business.address}</span>}
          {business.website && (
            <a href={business.website} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-primary-700 hover:underline">
              <Globe size={13} aria-hidden="true" />
              Sitio web
            </a>
          )}
        </div>

        {business.description && (
          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600">{business.description}</p>
        )}

        {/* Engagement bar — only when authenticated */}
        {engagement?.isAuthenticated && (
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <BusinessEngagementBar
              businessId={business.id}
              businessName={business.name}
              initialIsFollowing={engagement.isFollowing}
              initialIsLiked={engagement.isLiked}
              initialIsCustomer={engagement.isCustomer}
              initialFollowersCount={engagement.followersCount}
              initialLikesCount={engagement.likesCount}
              initialCustomersCount={engagement.customersCount}
            />
          </div>
        )}
      </div>
    </section>
  )
}

/* Mobile sticky bottom bar */
export function BusinessMobileBar({
  business,
  isAdmin,
  isAuthenticated,
  isFollowing,
}: {
  business: BusinessDetail
  isAdmin?: boolean
  isAuthenticated?: boolean
  isFollowing?: boolean
}) {
  const whatsappUrl = business.whatsapp
    ? `https://wa.me/${sanitizeWhatsApp(business.whatsapp)}?text=${encodeURIComponent(`Hola, quiero pedir en ${business.name}.`)}`
    : null

  const showFollow = isAuthenticated && !isAdmin

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur-md sm:hidden">
      {isAdmin && (
        <Link
          href={`/negocios/admin/${business.id}` as never}
          className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          Administrar
        </Link>
      )}

      {showFollow && (
        <MobileFollowButton
          businessId={business.id}
          initialIsFollowing={isFollowing ?? false}
        />
      )}

      {whatsappUrl ? (
        <a href={whatsappUrl} target="_blank" rel="noreferrer"
          className={[
            'inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-700 py-3 text-sm font-semibold text-white transition hover:bg-primary-800',
            showFollow ? 'px-4' : 'flex-1',
          ].join(' ')}>
          <MessageCircle size={15} aria-hidden="true" />
          {showFollow ? 'WhatsApp' : 'Pedir por WhatsApp'}
        </a>
      ) : !showFollow && (
        <span className="flex-1 inline-flex items-center justify-center rounded-2xl bg-neutral-100 py-3 text-sm text-neutral-400">
          Sin contacto disponible
        </span>
      )}
    </div>
  )
}
