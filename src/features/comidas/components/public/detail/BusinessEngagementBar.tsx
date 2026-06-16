'use client'

import { useState } from 'react'
import { Heart, UserCheck, UserPlus, Users } from 'lucide-react'
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

    const prev = { isFollowing, isLiked, isCustomer, followersCount, likesCount, customersCount }

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
      setIsFollowing(prev.isFollowing)
      setIsLiked(prev.isLiked)
      setIsCustomer(prev.isCustomer)
      setFollowersCount(prev.followersCount)
      setLikesCount(prev.likesCount)
      setCustomersCount(prev.customersCount)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={`Acciones para ${businessName}`}>
      {/* Follow — dominant CTA: connects business to user's feed */}
      <button
        type="button"
        disabled={!!loading}
        onClick={() => void handleToggle('follow')}
        aria-pressed={isFollowing}
        title={isFollowing ? 'Dejar de seguir' : 'Seguir para ver novedades en tu feed'}
        className={[
          'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition',
          'focus:outline-none focus:ring-2 focus:ring-primary-700/20 disabled:cursor-not-allowed disabled:opacity-70',
          loading !== 'follow' && 'hover:-translate-y-px hover:shadow-md',
          isFollowing
            ? 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
            : 'bg-primary-700 text-white hover:bg-primary-800',
        ].filter(Boolean).join(' ')}
      >
        {isFollowing ? <UserCheck size={15} aria-hidden="true" /> : <UserPlus size={15} aria-hidden="true" />}
        <span>{isFollowing ? 'Siguiendo' : 'Seguir'}</span>
        {followersCount > 0 && (
          <span className={['text-xs', isFollowing ? 'opacity-60' : 'opacity-75'].join(' ')}>
            · {followersCount}
          </span>
        )}
      </button>

      {/* Like */}
      <button
        type="button"
        disabled={!!loading}
        onClick={() => void handleToggle('like')}
        aria-pressed={isLiked}
        title={isLiked ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        className={[
          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm transition',
          'focus:outline-none focus:ring-2 focus:ring-primary-700/20 disabled:cursor-not-allowed disabled:opacity-70',
          loading !== 'like' && 'hover:-translate-y-px hover:shadow',
          isLiked
            ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
        ].filter(Boolean).join(' ')}
      >
        <Heart
          size={14}
          aria-hidden="true"
          className={isLiked ? 'fill-rose-500 text-rose-500' : ''}
        />
        <span>{likesCount > 0 ? `${likesCount} me gusta` : 'Me gusta'}</span>
      </button>

      {/* Customer */}
      <button
        type="button"
        disabled={!!loading}
        onClick={() => void handleToggle('customer')}
        aria-pressed={isCustomer}
        title={isCustomer ? 'Quitar como cliente frecuente' : 'Marcar como cliente frecuente'}
        className={[
          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm transition',
          'focus:outline-none focus:ring-2 focus:ring-primary-700/20 disabled:cursor-not-allowed disabled:opacity-70',
          loading !== 'customer' && 'hover:-translate-y-px hover:shadow',
          isCustomer
            ? 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100'
            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
        ].filter(Boolean).join(' ')}
      >
        <Users size={14} aria-hidden="true" />
        <span>{isCustomer ? 'Cliente frecuente' : 'Soy cliente'}</span>
      </button>
    </div>
  )
}
