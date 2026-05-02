'use client'

import { useFriendships } from '@/features/friendships/hooks/useFriendships'
import Avatar from '@/ui/Avatar'
import Link from 'next/link'
import { useState } from 'react'

const MAX_VISIBLE = 3

export function FriendRequestsCard() {
  const { pendingRequests, acceptFriendRequest, rejectFriendRequest } = useFriendships()
  const [busyId, setBusyId] = useState<string | null>(null)

  if (!pendingRequests || pendingRequests.length === 0) return null

  const visible = pendingRequests.slice(0, MAX_VISIBLE)

  const onAccept = async (id: string) => {
    setBusyId(id)
    try {
      await acceptFriendRequest(id)
    } finally {
      setBusyId(null)
    }
  }

  const onReject = async (id: string) => {
    setBusyId(id)
    try {
      await rejectFriendRequest(id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="rounded-xl bg-white shadow-sm dark:bg-neutral-900">
      <div className="flex items-center justify-between px-4 pt-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Solicitudes de amistad
        </h3>
        <Link
          href={'/friends/requests' as never}
          className="text-xs font-medium text-primary-600 hover:underline"
        >
          Ver todos
        </Link>
      </div>

      <ul className="mt-3 space-y-3 px-4 pb-4">
        {visible.map((req) => {
          const profile = req.profile ?? req.senderProfile
          const name =
            profile?.firstName && profile?.lastName
              ? `${profile.firstName} ${profile.lastName}`
              : profile?.username || 'Usuario'
          const initials = (profile?.firstName?.[0] ?? '') + (profile?.lastName?.[0] ?? '') ||
            profile?.username?.slice(0, 2).toUpperCase() ||
            'U'
          const busy = busyId === req.id

          return (
            <li key={req.id} className="flex items-start gap-3">
              <Avatar
                src={profile?.avatar}
                initials={initials.toUpperCase()}
                className="size-10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {name}
                </p>
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                  Quiere ser tu amigo
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => onAccept(req.id)}
                    disabled={busy}
                    className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => onReject(req.id)}
                    disabled={busy}
                    className="flex-1 rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-200 disabled:opacity-60 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default FriendRequestsCard
