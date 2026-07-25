/**
 * ProfileCard Component
 *
 * Tarjeta para mostrar un perfil profesional en el listado
 */

'use client'

import type { ProfessionalProfile } from '@/features/professional-profile/interfaces/professional-profile.interfaces'
import { UserIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'

import { getUserDisplayName } from '@/lib/user-helpers'

interface ProfileCardProps {
  profile: ProfessionalProfile
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const username = profile.user?.username || 'usuario'
  const displayName = getUserDisplayName(profile.user)
  const avatar = profile.user?.avatar

  // Obtener el primer título si existe
  const mainTitle = profile.titles?.[0]?.name || 'Profesional'

  return (
    <Link
      href={`/@${username}`}
      className="group block rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-primary-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-primary-600"
    >
      {/* Avatar y nombre */}
      <div className="mb-4 flex items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-primary-400 to-primary-600 ring-2 ring-primary-100 dark:ring-primary-900/30">
          {avatar ? (
            <img src={avatar} alt={displayName} className="h-full w-full object-cover" decoding="async" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UserIcon className="h-8 w-8 text-white" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-lg leading-tight font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            {displayName}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">@{username}</p>
        </div>
      </div>

      {/* Título principal */}
      <div className="mb-3">
        <p className="font-medium text-neutral-800 dark:text-neutral-200">{mainTitle}</p>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {profile.bio}
        </p>
      )}

      {/* Stats */}
      <div className="mb-4 flex items-center gap-4 rounded-lg bg-neutral-50 px-3 py-2 text-sm dark:bg-neutral-700/50">
        {profile.titles && profile.titles.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{profile.titles.length}</span>
            <span className="text-neutral-500 dark:text-neutral-400">títulos</span>
          </div>
        )}
        {profile.experience && profile.experience.length > 0 && (
          <>
            <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-600" />
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">{profile.experience.length}</span>
              <span className="text-neutral-500 dark:text-neutral-400">experiencias</span>
            </div>
          </>
        )}
      </div>

      {/* Badge de perfil profesional */}
      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          Perfil Profesional
        </span>
      </div>
    </Link>
  )
}
