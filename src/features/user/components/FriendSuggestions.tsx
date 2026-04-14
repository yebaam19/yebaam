'use client'

import { UserPlusIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import { CheckCircleIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useFriendRequests } from '../hooks/useFriendRequests'
import type { Route } from 'next';

/**
 * Componente FriendSuggestions
 *
 * Muestra 4 sugerencias de amigos basadas en:
 * - Amigos mutuos
 * - Ubicación común
 * - Intereses compartidos
 * - Idiomas comunes
 *
 * Estilo: Facebook-like cards con acción rápida
 */
export function FriendSuggestions() {
  const { suggestions, isLoadingSuggestions, sendRequest, isSending } = useFriendRequests()

  const [hiddenSuggestions, setHiddenSuggestions] = useState<Set<string>>(new Set())
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())

  const handleSendRequest = async (userId: string) => {
    try {
      await sendRequest(userId)
      setSentRequests((prev) => new Set(prev).add(userId))
    } catch (error) {
      console.error('Error al enviar solicitud:', error)
    }
  }

  const handleHideSuggestion = (userId: string) => {
    setHiddenSuggestions((prev) => new Set(prev).add(userId))
  }

  // Filtrar sugerencias ocultas
  const visibleSuggestions = suggestions.filter((suggestion) => !hiddenSuggestions.has(suggestion.id))

  if (isLoadingSuggestions) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Personas que quizás conozcas</h2>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 rounded-lg bg-gray-200 dark:bg-gray-700" />
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
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Personas que quizás conozcas</h2>
        <Link
          href={'/friends/suggestions' as Route}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Ver todo
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visibleSuggestions.slice(0, 4).map((suggestion) => {
          const isRequestSent = sentRequests.has(suggestion.id)

          return (
            <div
              key={suggestion.id}
              className="relative overflow-hidden rounded-lg border border-gray-200 transition-shadow duration-200 hover:shadow-md dark:border-gray-700"
            >
              {/* Botón X para ocultar sugerencia */}
              <button
                onClick={() => handleHideSuggestion(suggestion.id)}
                className="absolute top-2 right-2 z-10 rounded-full bg-white/90 p-1.5 transition-colors hover:bg-gray-100 dark:bg-gray-800/90 dark:hover:bg-gray-700"
                aria-label="Ocultar sugerencia"
              >
                <XMarkIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Avatar */}
              <div className="relative h-40 bg-linear-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600">
                {suggestion.avatar ? (
                  <Image
                    src={suggestion.avatar}
                    alt={`${suggestion.firstName} ${suggestion.lastName}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-5xl font-bold text-gray-400 dark:text-gray-500">
                      {suggestion.firstName.charAt(0)}
                      {suggestion.lastName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Información del usuario */}
              <div className="p-3">
                <Link href={`/${suggestion.username}` as Route} className="block hover:underline">
                  <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {suggestion.firstName} {suggestion.lastName}
                  </h3>
                </Link>

                {/* Razón de sugerencia */}
                <div className="mt-1 flex items-center gap-1.5">
                  {suggestion.mutualFriends > 0 && (
                    <div className="flex -space-x-1.5">
                      <div className="h-4 w-4 rounded-full border border-white bg-blue-500 dark:border-gray-800" />
                      <div className="h-4 w-4 rounded-full border border-white bg-green-500 dark:border-gray-800" />
                    </div>
                  )}
                  <p className="text-xs text-gray-600 dark:text-gray-400">{suggestion.reason}</p>
                </div>

                {/* Ubicación */}
                {suggestion.location && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
                    {typeof suggestion.location === 'string'
                      ? suggestion.location
                      : `${suggestion.location.city || ''}${suggestion.location.city && suggestion.location.country ? ', ' : ''}${suggestion.location.country || ''}`}
                  </p>
                )}

                {/* Botón de acción */}
                <div className="mt-3">
                  {isRequestSent ? (
                    <button
                      disabled
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Solicitud enviada
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(suggestion.id)}
                      disabled={isSending}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600"
                    >
                      <UserPlusIcon className="h-4 w-4" />
                      Agregar amigo
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
