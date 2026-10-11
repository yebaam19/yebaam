'use client'

import { CheckIcon,UserGroupIcon,UserPlusIcon,XMarkIcon } from '@/components/icons/heroicons-shim'
import { getUserDisplayName } from '@/lib/user-helpers'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useFriendRequests } from '../hooks/useFriendRequests'

type FriendRequestsApi = ReturnType<typeof useFriendRequests>

interface FriendSuggestionCardProps {
  userId: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  mutualFriends?: number
  reason?: string
  onHide?: (userId: string) => void
  // Passed down from FriendSuggestionsCompact so each card does NOT mount its
  // own useFriendRequests() (which would re-fire friend_suggestions + friend
  // requests per card — the source of the 14x friend_suggestions burst).
  sendRequest: FriendRequestsApi['sendRequest']
  isSending: FriendRequestsApi['isSending']
  sentRequests: FriendRequestsApi['sentRequests']
}

/**
 * Card individual de sugerencia de amigo
 * Versión compacta estilo Facebook para carrusel
 */
export function FriendSuggestionCard({
  userId,
  username,
  firstName,
  lastName,
  avatar,
  mutualFriends,
  reason,
  onHide,
  sendRequest,
  isSending,
  sentRequests,
}: FriendSuggestionCardProps) {
  const t = useTranslations('friendships.suggestionCard')
  const [requestSent, setRequestSent] = useState(false)

  // Valores por defecto seguros
  const displayFirstName = firstName || username
  const displayLastName = lastName || ''
  // Full real name for the visible label (falls back to @handle, never email).
  const displayName = getUserDisplayName({ firstName, lastName, username })
  const displayMutualFriends = mutualFriends || 0
  const displayReason = reason || ''

  const handleSendRequest = async () => {
    try {
      await sendRequest(userId)
      setRequestSent(true)
    } catch (error) {
      console.error('Error al enviar solicitud:', error)
    }
  }

  const isRequestSent = requestSent || sentRequests.some((req) => req.toUserId === userId)

  return (
    <div className="relative w-40 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {/* Botón X para ocultar */}
      {onHide && (
        <button
          onClick={() => onHide(userId)}
          className="absolute top-1.5 right-1.5 z-10 rounded-full bg-white/80 p-1 transition-colors hover:bg-gray-100 dark:bg-gray-800/80 dark:hover:bg-gray-700"
          aria-label={t('hideAria')}
        >
          <XMarkIcon className="h-3.5 w-3.5 text-gray-500" />
        </button>
      )}

      {/* Avatar */}
      <Link href={`/${username}` as Route} className="block">
        <div className="relative h-28 w-full bg-linear-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600">
          {avatar ? (
            <Image src={avatar} alt={`${displayFirstName} ${displayLastName}`} fill sizes="160px" className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl font-bold text-gray-400 dark:text-gray-500">
              {displayFirstName.charAt(0).toUpperCase()}
              {displayLastName ? displayLastName.charAt(0).toUpperCase() : ''}
            </div>
          )}
        </div>
      </Link>

      {/* Información */}
      <div className="p-2.5">
        <Link href={`/${username}` as Route} className="block hover:underline">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {displayName}
          </p>
        </Link>

        {displayMutualFriends > 0 && (
          <div className="mt-0.5 flex items-center gap-1">
            <UserGroupIcon className="h-3 w-3 text-gray-400" />
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{displayReason}</p>
          </div>
        )}

        {/* Botón de acción */}
        <div className="mt-2">
          {isRequestSent ? (
            <button
              disabled
              className="flex w-full items-center justify-center gap-1 rounded-md bg-green-50 px-2 py-1.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400"
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Enviada
            </button>
          ) : (
            <button
              onClick={handleSendRequest}
              disabled={isSending}
              className="flex w-full items-center justify-center gap-1 rounded-md bg-blue-600 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
            >
              <UserPlusIcon className="h-3.5 w-3.5" />
              Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Componente de carrusel de sugerencias
 * Estilo Facebook-like con scroll horizontal
 */
export { FriendSuggestionsCompact } from './FriendSuggestionsCompact'
