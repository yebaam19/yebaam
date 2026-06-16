'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { MapPin, Star, MessageCircle, Flame } from 'lucide-react'
import type { Business } from '../../types'
import { toggleFollow } from '../../actions/engagement.actions'
import { cfImageUrl } from '@/lib/cloudflare'

function sanitizeWhatsApp(value: string) {
  return value.replace(/[^\d]/g, '')
}

const CATEGORY_ICONS: Record<string, string> = {
  RESTAURANT: '🍽️',
  CAFE: '☕',
  BAKERY: '🥐',
  ICE_CREAM: '🍦',
  BAR: '🍸',
  PIZZA: '🍕',
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
  const icon = CATEGORY_ICONS[business.category] ?? '🍽️'
  const rating = Number(business.avg_rating ?? 0)
  const reviews = business.review_count ?? 0
  const hasRating = reviews > 0

  async function handleFollow(e: React.MouseEvent) {
    e.preventDefault()
    if (isPending) return
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
  }

  const whatsappUrl = business.whatsapp
    ? `https://wa.me/${sanitizeWhatsApp(business.whatsapp)}?text=${encodeURIComponent(`Hola, quiero pedir en ${business.name}.`)}`
    : null

  return (
    <article className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      {/* Cover image */}
      <div className="relative h-56 bg-primary-50 overflow-hidden">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={business.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
            <span className="text-5xl" aria-hidden="true">{icon}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent" />

        {/* Badges top-left */}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-700 backdrop-blur-sm">
            {business.category}
          </span>
          {business.is_verified && (
            <span className="rounded-full bg-primary-700 px-3 py-1 text-xs font-semibold text-white">
              ✓ Verificado
            </span>
          )}
        </div>


        {/* Name + city over gradient */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-white">{business.name}</h2>
              {business.city && (
                <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
                  <MapPin size={13} aria-hidden="true" />
                  <span className="truncate">{business.city}</span>
                </p>
              )}
            </div>
            {hasRating && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-700 backdrop-blur-sm shrink-0">
                <Star size={11} className="text-secondary-700" aria-hidden="true" />
                {rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-4 p-5">
        {business.description ? (
          <p className="line-clamp-2 text-sm leading-6 text-neutral-600">{business.description}</p>
        ) : (
          <p className="text-sm text-neutral-400 italic">Este negocio está preparando su presentación.</p>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
          <span className="rounded-full bg-neutral-100 px-3 py-1">
            {hasRating ? `${reviews} reseña${reviews !== 1 ? 's' : ''}` : 'Sin reseñas aún'}
          </span>
          {business.address && (
            <span className="rounded-full bg-neutral-100 px-3 py-1">Dirección disponible</span>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2">
          {isAuthenticated && (
            <button
              onClick={handleFollow}
              disabled={isPending}
              aria-label={following ? `Dejar de seguir ${business.name}` : `Seguir ${business.name}`}
              className={[
                'w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-70',
                following
                  ? 'border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100'
                  : 'bg-primary-700 text-white hover:bg-primary-800',
              ].join(' ')}
            >
              {following ? '✓ Siguiendo' : '+ Seguir este negocio'}
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/negocios/${business.slug}` as never}
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              Ver perfil
            </Link>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                <MessageCircle size={14} aria-hidden="true" />
                WhatsApp
              </a>
            ) : (
              <span className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-semibold text-neutral-400">
                Sin WhatsApp
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

/** Skeleton usado mientras carga el filtro client-side */
export function BusinessCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="h-56 animate-pulse bg-neutral-200" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-11 animate-pulse rounded-2xl bg-neutral-200" />
          <div className="h-11 animate-pulse rounded-2xl bg-neutral-200" />
        </div>
      </div>
    </div>
  )
}

export { Flame }
