import { useEffect, useState } from 'react'
import { FaUserPlus, FaUserCheck } from 'react-icons/fa6'
import { isAuthenticated } from '../../../lib/session'
import { toggleBusinessFollow } from '../api'
import { getErrorMessage } from '../../../lib/httpError'

interface BusinessFollowButtonProps {
  businessId: number
  businessName: string
  initialIsFollowing?: boolean
  initialFollowersCount?: number
  onRequireAuth?: () => void
  onStateChange?: (isFollowing: boolean, followersCount: number) => void
  className?: string
}

export default function BusinessFollowButton({
  businessId,
  businessName,
  initialIsFollowing = false,
  initialFollowersCount = 0,
  onRequireAuth,
  onStateChange,
  className = '',
}: BusinessFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsFollowing(initialIsFollowing)
    setFollowersCount(initialFollowersCount)
    setError('')
  }, [businessId, initialIsFollowing, initialFollowersCount])

  async function handleToggle() {
    if (!isAuthenticated()) {
      onRequireAuth?.()
      return
    }

    if (loading) return

    const previousIsFollowing = isFollowing
    const previousFollowersCount = followersCount
    const nextIsFollowing = !previousIsFollowing
    const nextFollowersCount = Math.max(
      0,
      previousFollowersCount + (nextIsFollowing ? 1 : -1)
    )

    setLoading(true)
    setError('')
    setIsFollowing(nextIsFollowing)
    setFollowersCount(nextFollowersCount)

    try {
      const result = await toggleBusinessFollow(businessId)
      setIsFollowing(result.isFollowing)
      setFollowersCount(result.followersCount)
      onStateChange?.(result.isFollowing, result.followersCount)
    } catch (err: unknown) {
      setIsFollowing(previousIsFollowing)
      setFollowersCount(previousFollowersCount)
      setError(getErrorMessage(err, 'No pudimos actualizar el seguimiento.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <button
        type="button"
        onClick={() => {
          void handleToggle()
        }}
        aria-pressed={isFollowing}
        aria-label={
          isFollowing
            ? `Dejar de seguir a ${businessName}`
            : `Seguir a ${businessName}`
        }
        title={isFollowing ? 'Dejar de seguir' : 'Seguir novedades'}
        disabled={loading}
        className={[
          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm transition',
          'focus:outline-none focus:ring-2 focus:ring-[rgba(15,95,47,0.18)] focus:ring-offset-2',
          loading ? 'cursor-not-allowed opacity-80' : 'hover:-translate-y-px hover:shadow',
          isFollowing
            ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
        ].join(' ')}
      >
        <span
          className={[
            'inline-flex h-4 w-4 items-center justify-center',
            isFollowing ? 'text-blue-600' : 'text-slate-500',
          ].join(' ')}
        >
          {isFollowing ? <FaUserCheck /> : <FaUserPlus />}
        </span>
        <span>{isFollowing ? 'Siguiendo' : 'Seguir novedades'}</span>
      </button>
      {error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
