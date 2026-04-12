'use client'

import { CheckIcon, UserGroupIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { useFriendRequests } from '../hooks/useFriendRequests'

interface FriendSuggestionCardProps {
  userId: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  mutualFriends?: number
  reason?: string
  onHide?: (userId: string) => void
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
}: FriendSuggestionCardProps) {
  const { sendRequest, isSending, sentRequests } = useFriendRequests()
  const [requestSent, setRequestSent] = useState(false)

  // Valores por defecto seguros
  const displayFirstName = firstName || username
  const displayLastName = lastName || ''
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
          aria-label="Ocultar sugerencia"
        >
          <XMarkIcon className="h-3.5 w-3.5 text-gray-500" />
        </button>
      )}

      {/* Avatar */}
      <Link href={`/${username}`} className="block">
        <div className="relative h-28 w-full bg-linear-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600">
          {avatar ? (
            <Image src={avatar} alt={`${displayFirstName} ${displayLastName}`} fill className="object-cover" />
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
        <Link href={`/${username}`} className="block hover:underline">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {displayFirstName} {displayLastName}
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
export function FriendSuggestionsCompact({ limit = 6 }: { limit?: number }) {
  const { suggestions, isLoadingSuggestions } = useFriendRequests()
  const [hiddenSuggestions, setHiddenSuggestions] = useState<Set<string>>(new Set())
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleHide = (userId: string) => {
    setHiddenSuggestions((prev) => new Set(prev).add(userId))
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 176 // card width (160px) + gap (16px)
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  // Validación defensiva: asegurar que suggestions sea un array
  const safeSuggestions = Array.isArray(suggestions) ? suggestions : []

  const visibleSuggestions = safeSuggestions
    .filter((s) => s && s.id && !hiddenSuggestions.has(s.id)) // Filtrar sugerencias válidas
    .slice(0, limit)



  if (isLoadingSuggestions) {
    return (
      <div className="p-3">
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`suggestion-skeleton-${i}`} className="w-40 shrink-0 animate-pulse">
              <div className="h-28 rounded-t-xl bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-2 rounded-b-xl border border-t-0 border-gray-200 p-2.5 dark:border-gray-700">
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-7 w-full rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (visibleSuggestions.length === 0) {
    return null
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Personas que quizás conozcas</h3>
        <Link
          href="/friends/suggestions"
          className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Ver más
        </Link>
      </div>

      {/* Carrusel */}
      <div className="group relative">
        {/* Botón scroll izquierda */}
        <button
          onClick={() => scroll('left')}
          className="absolute top-1/2 left-1 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1.5 opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          aria-label="Anterior"
        >
          <ChevronLeftIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Container con scroll */}
        <div
          ref={scrollContainerRef}
          className="scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth p-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {visibleSuggestions
            .filter((suggestion) => suggestion && suggestion.id && suggestion.username)
            .map((suggestion) => (
              <FriendSuggestionCard
                key={suggestion.id}
                userId={suggestion.id}
                username={suggestion.username}
                firstName={suggestion.firstName || ''}
                lastName={suggestion.lastName || ''}
                avatar={suggestion.avatar}
                mutualFriends={suggestion.mutualFriends || 0}
                reason={suggestion.reason || ''}
                onHide={handleHide}
              />
            ))}
        </div>

        {/* Botón scroll derecha */}
        <button
          onClick={() => scroll('right')}
          className="absolute top-1/2 right-1 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1.5 opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          aria-label="Siguiente"
        >
          <ChevronRightIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    </div>
  )
}
