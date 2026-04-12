'use client'

import {
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
  HeartIcon as HeartOutline,
  UserMinusIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { useFriends } from '../hooks/useFriends'
import { ConfirmRemoveFriendModal } from './ConfirmRemoveFriendModal'

interface FriendCardProps {
  friend: {
    friendId: string
    friendshipId?: string // ID de la relación de amistad
    username: string
    firstName: string
    lastName: string
    avatar?: string
    friendSince: string
    closeFriend: boolean
    mutualFriends?: number
    location?: string | { city?: string; country?: string }
  }
  onToggleClose: (friendId: string) => void
  onRemove: (friendshipId: string) => void
}

function FriendCard({ friend, onToggleClose, onRemove }: FriendCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = async () => {
    if (!friend.friendshipId) {
      console.error('No friendshipId available')
      toast.error('No se puede eliminar este amigo')
      return
    }

    setIsRemoving(true)
    try {
      await onRemove(friend.friendshipId)
      setShowRemoveModal(false)
    } catch (error) {
      console.error('Error al eliminar amigo:', error)
    } finally {
      setIsRemoving(false)
      setShowMenu(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white transition-shadow duration-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
      {/* Avatar/Cover */}
      <div className="relative h-40 overflow-hidden rounded-t-lg bg-linear-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600">
        {friend.avatar ? (
          <Image src={friend.avatar} alt={`${friend.firstName} ${friend.lastName}`} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-5xl font-bold text-gray-400 dark:text-gray-500">
              {friend.firstName.charAt(0)}
              {friend.lastName.charAt(0)}
            </span>
          </div>
        )}

        {/* Botón de amigo cercano */}
        <button
          onClick={() => onToggleClose(friend.friendId)}
          className="absolute top-2 right-2 rounded-full bg-white/90 p-2 transition-colors hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-700"
          aria-label={friend.closeFriend ? 'Quitar de amigos cercanos' : 'Agregar a amigos cercanos'}
        >
          {friend.closeFriend ? (
            <HeartSolid className="h-5 w-5 text-red-500" />
          ) : (
            <HeartOutline className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Información */}
      <div className="p-4">
        <Link href={`/${friend.username}`} className="block hover:underline">
          <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
            {friend.firstName} {friend.lastName}
          </h3>
        </Link>

        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">@{friend.username}</p>

        {friend.mutualFriends && friend.mutualFriends > 0 && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            {friend.mutualFriends} {friend.mutualFriends === 1 ? 'amigo' : 'amigos'} en común
          </p>
        )}

        {friend.location && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
            {typeof friend.location === 'string'
              ? friend.location
              : [friend.location.city, friend.location.country].filter(Boolean).join(', ')}
          </p>
        )}

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          Amigos desde {formatDistanceToNow(new Date(friend.friendSince), { locale: es })}
        </p>

        {/* Acciones */}
        <div className="mt-4 flex gap-2">
          <Link
            href={`/messages/${friend.friendId}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <ChatBubbleLeftIcon className="h-4 w-4" />
            Mensaje
          </Link>

          {/* TODO: REVISAR Botón de menú */}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                  <button
                    onClick={() => {
                      onToggleClose(friend.friendId)
                      setShowMenu(false)
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {friend.closeFriend ? (
                      <>
                        <HeartOutline className="h-4 w-4" />
                        Quitar de cercanos
                      </>
                    ) : (
                      <>
                        <HeartSolid className="h-4 w-4" />
                        Amigo cercano
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowRemoveModal(true)
                      setShowMenu(false)
                    }}
                    disabled={isRemoving}
                    className="flex w-full items-center gap-2 rounded-b-lg px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <UserMinusIcon className="h-4 w-4" />
                    Eliminar amigo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      <ConfirmRemoveFriendModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleRemove}
        friendName={`${friend.firstName} ${friend.lastName}`}
        isRemoving={isRemoving}
      />
    </div>
  )
}

/**
 * Componente FriendsList
 * Muestra la lista de amigos en grid
 */
export function FriendsList() {
  const { friends, total, isLoading, toggleCloseFriend, removeFriend } = useFriends()
  const [filter, setFilter] = useState<'all' | 'close'>('all')

  const filteredFriends = filter === 'close' ? friends.filter((f) => f.closeFriend) : friends

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Amigos</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`friend-skeleton-${i}`}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="animate-pulse">
                <div className="h-40 bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-9 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (friends.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <HeartOutline className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Aún no tienes amigos</h3>
        <p className="text-gray-600 dark:text-gray-400">Comienza a conectar con personas que conozcas</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Amigos</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {total} {total === 1 ? 'amigo' : 'amigos'}
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Todos ({total})
          </button>
          <button
            onClick={() => setFilter('close')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'close'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <HeartSolid className="h-4 w-4" />
            Cercanos ({friends.filter((f) => f.closeFriend).length})
          </button>
        </div>
      </div>

      {filteredFriends.length === 0 ? (
        <div className="rounded-lg bg-gray-50 py-12 text-center dark:bg-gray-800/50">
          <HeartOutline className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">No tienes amigos cercanos aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredFriends.map((friend) => (
            <FriendCard
              key={friend.friendId}
              friend={friend}
              onToggleClose={toggleCloseFriend}
              onRemove={removeFriend}
            />
          ))}
        </div>
      )}
    </div>
  )
}
