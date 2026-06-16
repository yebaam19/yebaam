import { useEffect, useState } from 'react'
import { FaHeart, FaRegHeart } from 'react-icons/fa6'
import { isAuthenticated } from '../../../lib/session'
import { toggleBusinessLike } from '../api'
import { getErrorMessage } from '../../../lib/httpError'

interface BusinessLikeButtonProps {
  businessId: number
  businessName: string
  initialHasLiked?: boolean
  initialLikesCount?: number
  onRequireAuth?: () => void
  className?: string
}

function formatLikesCount(likesCount: number) {
  const safeCount = Math.max(0, likesCount)
  return `${safeCount} favorito${safeCount === 1 ? '' : 's'}`
}

export default function BusinessLikeButton({
  businessId,
  businessName,
  initialHasLiked = false,
  initialLikesCount = 0,
  onRequireAuth,
  className = '',
}: BusinessLikeButtonProps) {
  const [hasLiked, setHasLiked] = useState(initialHasLiked)
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setHasLiked(initialHasLiked)
    setLikesCount(initialLikesCount)
    setError('')
  }, [businessId, initialHasLiked, initialLikesCount])

  async function handleToggle() {
    if (!isAuthenticated()) {
      onRequireAuth?.()
      return
    }

    if (loading) return

    const previousHasLiked = hasLiked
    const previousLikesCount = likesCount
    const nextHasLiked = !previousHasLiked
    const nextLikesCount = Math.max(
      0,
      previousLikesCount + (nextHasLiked ? 1 : -1)
    )

    setLoading(true)
    setError('')
    setHasLiked(nextHasLiked)
    setLikesCount(nextLikesCount)

    try {
      const result = await toggleBusinessLike(businessId)
      setHasLiked(result.hasLiked)
      setLikesCount(result.likesCount)
    } catch (err: unknown) {
      setHasLiked(previousHasLiked)
      setLikesCount(previousLikesCount)
      setError(getErrorMessage(err, 'No pudimos actualizar tus favoritos.'))
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
        aria-pressed={hasLiked}
        aria-label={
          hasLiked
            ? `Quitar ${businessName} de favoritos`
            : `Guardar ${businessName} en favoritos`
        }
        title={hasLiked ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        disabled={loading}
        className={[
          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm transition',
          'focus:outline-none focus:ring-2 focus:ring-[rgba(15,95,47,0.18)] focus:ring-offset-2',
          loading ? 'cursor-not-allowed opacity-80' : 'hover:-translate-y-px hover:shadow',
          hasLiked
            ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
        ].join(' ')}
      >
        <span
          className={[
            'inline-flex h-4 w-4 items-center justify-center',
            hasLiked ? 'text-rose-500' : 'text-slate-500',
          ].join(' ')}
        >
          {loading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : hasLiked ? (
            <FaHeart className="h-4 w-4" />
          ) : (
            <FaRegHeart className="h-4 w-4" />
          )}
        </span>
        <span>{formatLikesCount(likesCount)}</span>
      </button>

      {error ? (
        <p className="mt-1 px-1 text-[11px] leading-4 text-rose-600" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  )
}
