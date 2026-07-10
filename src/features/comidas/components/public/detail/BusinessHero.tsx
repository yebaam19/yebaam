import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Globe, MapPin, MessageCircle, Phone, Share2, Star } from 'lucide-react'
import type { BusinessDetail } from '../../../types'
import { BusinessEngagementBar } from './BusinessEngagementBar'
import { MobileFollowButton } from './MobileFollowButton'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

export function cfImageUrl(id: string | null) {
  if (!id || !CF_HASH) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/public`
}

function sanitizeWhatsApp(v: string) { return v.replace(/[^\d]/g, '') }

/** Brand-consistent gradient for businesses without a cover photo. */
function BusinessPlaceholderCover() {
  return (
    <div
      className="h-full w-full"
      style={{
        background:
          'radial-gradient(ellipse at 30% 40%, rgba(22,164,76,0.22) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(255,156,49,0.12) 0%, transparent 50%), rgb(249,250,251)',
      }}
    />
  )
}

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
  const hasRating = reviews > 0

  const whatsappUrl = business.whatsapp
    ? `https://wa.me/${sanitizeWhatsApp(business.whatsapp)}?text=${encodeURIComponent(`Hola, vi tu negocio en Yebaam y me gustaría hacer una consulta.`)}`
    : null

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)] ring-1 ring-neutral-950/5">

      {/* ── Cover ─────────────────────────────────────────────────── */}
      <div className="relative h-56 overflow-hidden sm:h-72">
        {coverUrl
          ? <Image src={coverUrl} alt={business.name} fill priority className="object-cover" sizes="100vw" />
          : <BusinessPlaceholderCover />}

        {/* Progressive scrim for text legibility */}
        <div className="absolute inset-0 bg-linear-to-b from-neutral-950/30 via-transparent to-neutral-950/50" />

        {/* Back nav */}
        <Link
          href={'/negocios' as never}
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-neutral-800 shadow-sm backdrop-blur-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Negocios
        </Link>

        {/* WhatsApp shortcut — desktop only */}
        {whatsappUrl && (
          <div className="absolute right-4 top-4 hidden sm:block">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold text-neutral-800 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-primary-700"
            >
              <MessageCircle size={14} aria-hidden="true" />
              Pedir ahora
            </a>
          </div>
        )}

        {/* Rating pill — overlaid on cover, bottom right */}
        {hasRating && (
          <div className="absolute bottom-4 right-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-sm font-bold text-neutral-900 shadow-md backdrop-blur-sm">
              <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden="true" />
              {rating.toFixed(1)}
              <span className="text-xs font-normal text-neutral-500">({reviews})</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Identity bar ──────────────────────────────────────────── */}
      <div className="relative bg-white px-5 pb-6 sm:px-8">

        {/* Avatar — pulled up from cover */}
        <div className="relative -mt-12 mb-4 flex items-end justify-between gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-primary-50 shadow-[0_4px_16px_rgba(0,0,0,0.16)] sm:h-28 sm:w-28">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={business.name}
                width={112}
                height={112}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary-600 to-primary-800 text-2xl font-black text-white">
                {business.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Desktop CTAs — aligned to bottom of avatar row */}
          <div className="hidden pb-1 sm:flex sm:flex-wrap sm:gap-2">
            {isAdmin && (
              <Link
                href={`/negocios/admin/${business.id}` as never}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              >
                Administrar
              </Link>
            )}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800 hover:shadow-md hover:shadow-primary-700/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <MessageCircle size={15} aria-hidden="true" />
                WhatsApp
              </a>
            )}
            {business.phone && !business.whatsapp && (
              <a
                href={`tel:${business.phone}`}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                <Phone size={15} aria-hidden="true" />
                Llamar
              </a>
            )}
          </div>
        </div>

        {/* Name + category + verification */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl">
              {business.name}
            </h1>
            {business.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-200">
                <span aria-hidden="true">✓</span> Verificado
              </span>
            )}
          </div>

          {/* Meta row: category + location + web */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
            <span className="font-medium text-neutral-700">{business.category}</span>
            {business.city && (
              <span className="flex items-center gap-1">
                <MapPin size={13} aria-hidden="true" />
                {business.city}
              </span>
            )}
            {business.address && (
              <span className="hidden sm:inline">{business.address}</span>
            )}
            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary-700 transition hover:underline"
              >
                <Globe size={13} aria-hidden="true" />
                Sitio web
              </a>
            )}
          </div>
        </div>

        {/* Description */}
        {business.description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
            {business.description}
          </p>
        )}

        {/* Engagement actions — only when authenticated */}
        {engagement?.isAuthenticated && (
          <div className="mt-5 border-t border-neutral-100 pt-5">
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
    </div>
  )
}

/* ── Mobile sticky bottom bar ─────────────────────────────────── */
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
    ? `https://wa.me/${sanitizeWhatsApp(business.whatsapp)}?text=${encodeURIComponent(`Hola, vi tu negocio en Yebaam y me gustaría hacer una consulta.`)}`
    : null

  const showFollow = isAuthenticated && !isAdmin

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-neutral-200/80 bg-white/95 px-4 py-3 backdrop-blur-md sm:hidden">
      {isAdmin && (
        <Link
          href={`/negocios/admin/${business.id}` as never}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
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
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className={[
            'inline-flex items-center justify-center gap-2 rounded-xl bg-primary-700 py-3 text-sm font-semibold text-white transition hover:bg-primary-800',
            showFollow ? 'px-4' : 'flex-1',
          ].join(' ')}
        >
          <MessageCircle size={15} aria-hidden="true" />
          {showFollow ? 'WhatsApp' : 'Contactar por WhatsApp'}
        </a>
      ) : !showFollow && (
        <div className="flex-1 inline-flex items-center justify-center rounded-xl bg-neutral-100 py-3 text-sm text-neutral-400">
          Sin contacto disponible
        </div>
      )}
    </div>
  )
}
