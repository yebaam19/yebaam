'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useCallback } from 'react'
import { MapPin, Star, MessageCircle, Heart } from 'lucide-react'
import type { Business } from '../../types'
import { toggleFollow } from '../../actions/engagement.actions'
import { cfImageUrl } from '@/lib/cloudflare'

function sanitizeWhatsApp(value: string) {
  return value.replace(/[^\d]/g, '')
}

/** Human-readable category labels — never show raw enum to users. */
const CATEGORY_LABELS: Record<string, string> = {
  RESTAURANT:  'Restaurante',
  CAFE:        'Café',
  BAKERY:      'Panadería',
  ICE_CREAM:   'Heladería',
  BAR:         'Bar',
  PIZZA:       'Pizzería',
  FAST_FOOD:   'Comida rápida',
  SEAFOOD:     'Mariscos',
  SUSHI:       'Sushi',
  VEGAN:       'Vegano',
}

const CATEGORY_EMOJI: Record<string, string> = {
  RESTAURANT:  '🍽️',
  CAFE:        '☕',
  BAKERY:      '🥐',
  ICE_CREAM:   '🍦',
  BAR:         '🍸',
  PIZZA:       '🍕',
  FAST_FOOD:   '🍔',
  SEAFOOD:     '🦞',
  SUSHI:       '🍱',
  VEGAN:       '🥗',
}

interface Props {
  business: Business
  isFollowed?: boolean
  isAuthenticated?: boolean
}

export function BusinessCard({ business, isFollowed = false, isAuthenticated = false }: Props) {
  const [following, setFollowing] = useState(isFollowed)
  const [isPending, setIsPending] = useState(false)

  const imgUrl = cfImageUrl(business.profile_cf_image_id)
  const emoji = CATEGORY_EMOJI[business.category] ?? '🍽️'
  const categoryLabel = CATEGORY_LABELS[business.category] ?? business.category
  const rating = Number(business.avg_rating ?? 0)
  const reviews = business.review_count ?? 0
  const hasRating = reviews > 0

  const whatsappUrl = business.whatsapp
    ? `https://wa.me/${sanitizeWhatsApp(business.whatsapp)}?text=${encodeURIComponent(`Hola, vi tu negocio en Yebaam. ¿Puedo hacer un pedido?`)}`
    : null

  const handleFollow = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isPending || !isAuthenticated) return
    setIsPending(true)
    setFollowing((prev) => !prev)
    try {
      const result = await toggleFollow(business.id)
      setFollowing(result.is_following)
    } catch {
      setFollowing((prev) => !prev)
    } finally {
      setIsPending(false)
    }
  }, [business.id, isAuthenticated, isPending])

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-neutral-950/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]">

      {/* Entire card is the link for maximum clickability */}
      <Link href={`/negocios/${business.slug}` as never} className="absolute inset-0 z-10" aria-label={`Ver ${business.name}`} />

      {/* Cover image */}
      <div className="relative h-48 overflow-hidden bg-linear-to-br from-primary-50 to-primary-100 sm:h-52">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={business.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl opacity-60" aria-hidden="true">{emoji}</span>
          </div>
        )}

        {/* Gradient scrim */}
        <div className="absolute inset-0 bg-linear-to-t from-neutral-950/60 via-neutral-950/10 to-transparent" />

        {/* Category badge — top left */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-neutral-700 backdrop-blur-sm shadow-sm">
            <span aria-hidden="true">{emoji}</span>
            {categoryLabel}
          </span>
          {business.is_verified && (
            <span className="flex items-center gap-1 rounded-full bg-primary-700 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              ✓
            </span>
          )}
        </div>

        {/* Follow heart — top right, z above the card link */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleFollow}
            disabled={isPending}
            aria-label={following ? `Dejar de seguir ${business.name}` : `Seguir ${business.name}`}
            aria-pressed={following}
            className={[
              'absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-150',
              'shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
              following
                ? 'bg-primary-700 text-white hover:bg-primary-800'
                : 'bg-white/90 text-neutral-400 hover:text-red-500',
              isPending && 'opacity-60',
            ].join(' ')}
          >
            <Heart
              size={15}
              aria-hidden="true"
              className={following ? 'fill-current' : ''}
            />
          </button>
        )}

        {/* Rating — bottom right */}
        {hasRating && (
          <div className="absolute bottom-3 right-3">
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-bold text-neutral-800 backdrop-blur-sm shadow-sm">
              <Star size={11} className="fill-amber-400 text-amber-400" aria-hidden="true" />
              {rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Name + city — bottom left */}
        <div className="absolute bottom-3 left-3 right-14 min-w-0">
          <h2 className="truncate text-lg font-bold leading-tight text-white drop-shadow-sm">
            {business.name}
          </h2>
          {business.city && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/80">
              <MapPin size={11} aria-hidden="true" />
              <span className="truncate">{business.city}</span>
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {business.description ? (
          <p className="line-clamp-2 text-sm leading-6 text-neutral-500">
            {business.description}
          </p>
        ) : (
          <p className="text-sm italic text-neutral-400">
            Explorá su carta y novedades.
          </p>
        )}

        {/* Meta tags row */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          {hasRating && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
              {reviews} reseña{reviews !== 1 ? 's' : ''}
            </span>
          )}
          {business.address && (
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-500">
              Con dirección
            </span>
          )}
          {business.instagram && (
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-500">
              Instagram
            </span>
          )}
        </div>

        {/* Footer action row */}
        <div className="mt-4 flex items-center gap-2">
          {/* "Ver menú" — primary CTA that's visually distinct */}
          <span className="relative z-20 inline-flex flex-1 items-center justify-center rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800">
            Ver menú
          </span>

          {/* WhatsApp — only rendered when available */}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Contactar ${business.name} por WhatsApp`}
              className="relative z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              <MessageCircle size={16} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

export function BusinessCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-950/5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="h-48 animate-pulse bg-neutral-100 sm:h-52" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded-lg bg-neutral-100" />
        <div className="h-4 w-full animate-pulse rounded-lg bg-neutral-100" />
        <div className="h-4 w-1/2 animate-pulse rounded-lg bg-neutral-100" />
        <div className="mt-4 flex gap-2">
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-neutral-100" />
          <div className="h-10 w-10 animate-pulse rounded-xl bg-neutral-100" />
        </div>
      </div>
    </div>
  )
}
