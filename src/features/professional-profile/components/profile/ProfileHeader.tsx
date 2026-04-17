/**
 * ProfileHeader Component
 *
 * Header del perfil profesional con avatar, nombre y acciones
 */

'use client'

import { followProfileAction, unfollowProfileAction } from '@/app/(app)/feed/professional-profile/server/profile.actions'
import { CheckBadgeIcon, Cog6ToothIcon, ShareIcon, UserMinusIcon, UserPlusIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import type { ProfessionalProfile } from '../../interfaces/professional-profile.interfaces'

interface ProfileHeaderProps {
  profile: ProfessionalProfile
  user: {
    id: string
    firstName: string
    lastName: string
    username: string
    avatar?: string | null
  }
  isOwner: boolean
  initialIsFollowing?: boolean
  onEditProfile?: () => void
}

export function ProfileHeader({ profile, user, isOwner, initialIsFollowing = false, onEditProfile }: ProfileHeaderProps) {
  const fullName = `${user.firstName} ${user.lastName}`
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isPending, startTransition] = useTransition()

  const handleFollow = () => {
    startTransition(async () => {
      const result = await followProfileAction(profile.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setIsFollowing(true)
      toast.success('Ahora sigues este perfil')
      router.refresh()
    })
  }

  const handleUnfollow = () => {
    startTransition(async () => {
      const result = await unfollowProfileAction(profile.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setIsFollowing(false)
      toast.success('Dejaste de seguir este perfil')
      router.refresh()
    })
  }

  // Generar la URL completa del perfil
  const profileUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/feed/professional-profile/${user.username}` : ''

  // Handler para copiar/compartir URL
  const handleShareProfile = async () => {
    try {
      // Copiar URL al clipboard
      await navigator.clipboard.writeText(profileUrl)
      toast.success('¡URL copiada al portapapeles!', {
        description: profileUrl,
        duration: 4000,
      })
    } catch (error) {
      console.error('Error copying to clipboard:', error)

      // Fallback manual si clipboard API falla
      const textArea = document.createElement('textarea')
      textArea.value = profileUrl
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()

      try {
        document.execCommand('copy')
        toast.success('¡URL copiada al portapapeles!')
      } catch (err) {
        toast.error('No se pudo copiar la URL. Por favor, cópiala manualmente.')
        console.error('Fallback copy failed:', err)
      }

      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="relative min-w-0 max-w-full">
      {/* Cover Image */}
      <div className="relative h-32 overflow-hidden rounded-t-2xl sm:h-40 lg:h-48">
        {profile.coverUrl ? (
          <Image src={profile.coverUrl} alt="Cover" fill className="object-cover" priority />
        ) : (
          <div className="h-full w-full bg-linear-to-r from-primary-500 via-primary-600 to-primary-700" />
        )}
      </div>

      {/* Content */}
      <div className="relative rounded-b-2xl border-x border-b border-neutral-200 px-4 pb-4 sm:px-6 dark:border-neutral-700">
        {/* Avatar */}
        <div className="absolute -top-12 left-4 sm:-top-16 sm:left-6">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg sm:h-32 sm:w-32 dark:border-neutral-900">
              {profile.avatarUrl || user.avatar ? (
                <Image
                  src={profile.avatarUrl || user.avatar || ''}
                  alt={fullName}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary-100 text-2xl font-bold text-primary-600 sm:text-3xl">
                  {user.firstName.charAt(0)}
                  {user.lastName.charAt(0)}
                </div>
              )}
            </div>

            {/* Badge de verificado */}
            <div className="absolute right-0 bottom-0 rounded-full bg-white p-1 shadow dark:bg-neutral-900">
              <CheckBadgeIcon className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>

        {/* Info and Actions */}
        <div className="ml-0 pt-14 sm:ml-36 sm:pt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* User Info */}
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="min-w-0 text-xl font-bold break-words text-neutral-900 sm:text-2xl dark:text-white">
                  {fullName}
                </h1>
                <CheckBadgeIcon className="h-5 w-5 text-primary-500" />
              </div>
              <p className="text-neutral-500 dark:text-neutral-400">@{user.username}</p>
              {profile.bio && (
                <p className="mt-2 max-w-md text-sm text-neutral-600 dark:text-neutral-300">{profile.bio}</p>
              )}

              {/* Visibility Badge - Solo visible para el dueño */}
              {isOwner && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium dark:bg-neutral-800">
                  {profile.visibility === 'PUBLIC' && (
                    <>
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      <span className="text-neutral-700 dark:text-neutral-300">Perfil Público</span>
                    </>
                  )}
                  {profile.visibility === 'LIMITED' && (
                    <>
                      <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                      <span className="text-neutral-700 dark:text-neutral-300">Perfil Limitado</span>
                    </>
                  )}
                  {profile.visibility === 'PRIVATE' && (
                    <>
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                      <span className="text-neutral-700 dark:text-neutral-300">Perfil Privado</span>
                    </>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="font-semibold text-neutral-900 dark:text-white">{profile._count?.titles || 0}</span>{' '}
                  <span className="text-neutral-500 dark:text-neutral-400">Titulos</span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {profile._count?.experience || 0}
                  </span>{' '}
                  <span className="text-neutral-500 dark:text-neutral-400">Experiencias</span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {profile._count?.followers || 0}
                  </span>{' '}
                  <span className="text-neutral-500 dark:text-neutral-400">Seguidores</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
              {isOwner ? (
                <>
                  <button
                    onClick={onEditProfile}
                    className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                    Editar Perfil
                  </button>
                  <button
                    onClick={handleShareProfile}
                    className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                    title="Compartir perfil"
                  >
                    <ShareIcon className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  {isFollowing ? (
                    <button
                      onClick={handleUnfollow}
                      disabled={isPending}
                      className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                    >
                      <UserMinusIcon className="h-4 w-4" />
                      Siguiendo
                    </button>
                  ) : (
                    <button
                      onClick={handleFollow}
                      disabled={isPending}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      <UserPlusIcon className="h-4 w-4" />
                      Seguir
                    </button>
                  )}
                  <button
                    onClick={handleShareProfile}
                    className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                    title="Compartir perfil"
                  >
                    <ShareIcon className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
