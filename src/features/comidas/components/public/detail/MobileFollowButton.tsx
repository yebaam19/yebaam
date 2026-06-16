'use client'

import { useState } from 'react'
import { UserCheck, UserPlus } from 'lucide-react'
import { toggleFollow } from '../../../actions/engagement.actions'

interface Props {
  businessId: string
  initialIsFollowing: boolean
}

export function MobileFollowButton({ businessId, initialIsFollowing }: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [pending, setPending] = useState(false)

  async function handleToggle() {
    if (pending) return
    setPending(true)
    const next = !isFollowing
    setIsFollowing(next)
    try {
      const r = await toggleFollow(businessId)
      setIsFollowing(r.is_following)
    } catch {
      setIsFollowing(!next)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void handleToggle()}
      aria-pressed={isFollowing}
      className={[
        'flex-1 inline-flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition disabled:opacity-70',
        isFollowing
          ? 'border border-blue-200 bg-blue-50 text-blue-700'
          : 'bg-primary-700 text-white',
      ].join(' ')}
    >
      {isFollowing
        ? <UserCheck size={15} aria-hidden="true" />
        : <UserPlus size={15} aria-hidden="true" />}
      <span>{isFollowing ? 'Siguiendo' : 'Seguir'}</span>
    </button>
  )
}
