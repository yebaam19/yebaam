'use client'

import { useState } from 'react'
import { Heart, ShoppingBag, Bell, BellOff } from 'lucide-react'
import { toggleFollow, toggleLike, toggleCustomer } from '../../../actions/engagement.actions'

interface Props {
  businessId: string
  businessName: string
  initialIsFollowing?: boolean
  initialIsLiked?: boolean
  initialIsCustomer?: boolean
  initialFollowersCount?: number
  initialLikesCount?: number
  initialCustomersCount?: number
}

type Kind = 'follow' | 'like' | 'customer'

function fmt(n: number): string {
  if (n === 0) return ''
  if (n >= 1000) return ` ${(n / 1000).toFixed(1)}K`
  return ` ${n}`
}

export function BusinessEngagementBar({
  businessId,
  businessName,
  initialIsFollowing = false,
  initialIsLiked = false,
  initialIsCustomer = false,
  initialFollowersCount = 0,
  initialLikesCount = 0,
  initialCustomersCount = 0,
}: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [isCustomer, setIsCustomer] = useState(initialIsCustomer)
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [customersCount, setCustomersCount] = useState(initialCustomersCount)
  const [loading, setLoading] = useState<Kind | null>(null)

  async function handleToggle(kind: Kind) {
    if (loading) return
    setLoading(kind)

    const snapshot = { isFollowing, isLiked, isCustomer, followersCount, likesCount, customersCount }

    try {
      if (kind === 'follow') {
        const next = !isFollowing
        setIsFollowing(next)
        setFollowersCount((c) => Math.max(0, c + (next ? 1 : -1)))
        const r = await toggleFollow(businessId)
        setIsFollowing(r.is_following)
        setFollowersCount(r.followers_count)
      } else if (kind === 'like') {
        const next = !isLiked
        setIsLiked(next)
        setLikesCount((c) => Math.max(0, c + (next ? 1 : -1)))
        const r = await toggleLike(businessId)
        setIsLiked(r.has_liked)
        setLikesCount(r.likes_count)
      } else {
        const next = !isCustomer
        setIsCustomer(next)
        setCustomersCount((c) => Math.max(0, c + (next ? 1 : -1)))
        const r = await toggleCustomer(businessId)
        setIsCustomer(r.is_customer)
        setCustomersCount(r.customers_count)
      }
    } catch {
      setIsFollowing(snapshot.isFollowing)
      setIsLiked(snapshot.isLiked)
      setIsCustomer(snapshot.isCustomer)
      setFollowersCount(snapshot.followersCount)
      setLikesCount(snapshot.likesCount)
      setCustomersCount(snapshot.customersCount)
    } finally {
      setLoading(null)
    }
  }

  const isPending = loading !== null

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label={`Acciones sociales para ${businessName}`}
    >
      {/* Follow — primary, dominant CTA */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => void handleToggle('follow')}
        aria-pressed={isFollowing}
        aria-label={isFollowing ? `Dejar de seguir ${businessName}` : `Seguir ${businessName} para ver novedades`}
        className={[
          'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-60',
          loading !== 'follow' && 'hover:-translate-y-px hover:shadow-md',
          isFollowing
            ? 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200 hover:bg-primary-100 focus-visible:ring-primary-500'
            : 'bg-primary-700 text-white shadow-sm hover:bg-primary-800 hover:shadow-primary-700/25 focus-visible:ring-primary-500',
        ].filter(Boolean).join(' ')}
      >
        {isFollowing
          ? <BellOff size={15} aria-hidden="true" className="shrink-0" />
          : <Bell size={15} aria-hidden="true" className="shrink-0" />}
        <span>{isFollowing ? 'Siguiendo' : 'Seguir'}</span>
        {followersCount > 0 && (
          <span className={['text-xs tabular-nums', isFollowing ? 'opacity-50' : 'opacity-70'].join(' ')}>
            {fmt(followersCount)}
          </span>
        )}
      </button>

      {/* Divider between primary and secondary */}
      <div className="self-stretch py-0.5">
        <div className="h-full w-px bg-neutral-200" aria-hidden="true" />
      </div>

      {/* Like */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => void handleToggle('like')}
        aria-pressed={isLiked}
        aria-label={isLiked ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        className={[
          'inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
          'ring-1 ring-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-60',
          loading !== 'like' && 'hover:-translate-y-px',
          isLiked
            ? 'bg-rose-50 text-rose-600 ring-rose-200 hover:bg-rose-100 focus-visible:ring-rose-400'
            : 'bg-white text-neutral-600 ring-neutral-200 hover:bg-neutral-50 focus-visible:ring-neutral-400',
        ].filter(Boolean).join(' ')}
      >
        <Heart
          size={14}
          aria-hidden="true"
          className={isLiked ? 'fill-rose-500 text-rose-500 shrink-0' : 'shrink-0'}
        />
        <span className="hidden sm:inline">{isLiked ? 'Guardado' : 'Guardar'}</span>
        {likesCount > 0 && (
          <span className="text-xs tabular-nums opacity-60">{fmt(likesCount)}</span>
        )}
      </button>

      {/* Customer */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => void handleToggle('customer')}
        aria-pressed={isCustomer}
        aria-label={isCustomer ? 'Quitar marca de cliente frecuente' : 'Marcarme como cliente frecuente'}
        className={[
          'inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
          'ring-1 ring-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-60',
          loading !== 'customer' && 'hover:-translate-y-px',
          isCustomer
            ? 'bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100 focus-visible:ring-amber-400'
            : 'bg-white text-neutral-600 ring-neutral-200 hover:bg-neutral-50 focus-visible:ring-neutral-400',
        ].filter(Boolean).join(' ')}
      >
        <ShoppingBag
          size={14}
          aria-hidden="true"
          className={isCustomer ? 'text-amber-600 shrink-0' : 'shrink-0'}
        />
        <span className="hidden sm:inline">{isCustomer ? 'Soy cliente' : 'Soy cliente'}</span>
        {customersCount > 0 && (
          <span className="text-xs tabular-nums opacity-60">{fmt(customersCount)}</span>
        )}
      </button>
    </div>
  )
}
