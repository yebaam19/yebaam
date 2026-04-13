import { Club } from '@/features/clubs/types/club.types'
import {
  formatGrowthRate,
  formatMembersCount,
  getCategoryColor,
  getCategoryLabel,
  getMembershipTierLabel,
  getTierBadgeColor,
} from '@/features/clubs/utils/clubHelpers'
import { CheckBadgeIcon, GlobeAltIcon, LockClosedIcon, UsersIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'

interface ClubHeaderProps {
  club: Club
  isMember: boolean
  isLoading: boolean
  onMembershipToggle: () => void
}

/**
 * Componente para el header del club con información principal
 * Incluye: imagen de perfil, nombre, categoría, privacidad, stats y botón de acción
 */
export function ClubHeader({ club, isMember, isLoading, onMembershipToggle }: ClubHeaderProps) {
  return (
    <div className="relative -mt-20 border-b border-gray-200 pb-8 dark:border-gray-700">
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Profile Image */}
        <div className="shrink-0">
          <div className="relative h-32 w-32 overflow-hidden rounded-xl border-4 border-white bg-white shadow-lg dark:border-gray-800 dark:bg-gray-700">
            {club.profileImageUrl ? (
              <Image src={club.profileImageUrl} alt={club.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
                <span className="text-4xl font-bold text-white">{club.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            {/* Title Row */}
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h1 className="truncate text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">{club.name}</h1>
                  {club.isVerified && <CheckBadgeIcon className="h-7 w-7 shrink-0 text-primary-500" />}
                </div>

                {/* Category & Privacy */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(club.category)}`}
                  >
                    {getCategoryLabel(club.category)}
                  </span>

                  <span className="text-gray-400 dark:text-gray-600">•</span>

                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    {club.privacy === 'PRIVATE' ? (
                      <>
                        <LockClosedIcon className="h-4 w-4" />
                        <span>Privado</span>
                      </>
                    ) : (
                      <>
                        <GlobeAltIcon className="h-4 w-4" />
                        <span>Público</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={onMembershipToggle}
                disabled={isLoading}
                className={`shrink-0 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors ${
                  isMember
                    ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
                    : 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {isLoading ? 'Procesando...' : isMember ? 'Abandonar' : 'Unirse al Club'}
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5">
                <UsersIcon className="h-5 w-5 text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatMembersCount(club.stats.membersCount)}
                </span>
                <span className="text-gray-600 dark:text-gray-400">miembros</span>
              </div>

              {club.stats.growthRate && club.stats.growthRate > 0 && (
                <>
                  <span className="text-gray-300 dark:text-gray-700">|</span>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <span className="font-medium">{formatGrowthRate(club.stats.growthRate)}</span>
                    <span className="text-xs">crecimiento</span>
                  </div>
                </>
              )}

              {club.isMember && club.currentUserTier && (
                <>
                  <span className="text-gray-300 dark:text-gray-700">|</span>
                  <span className={`rounded px-2 py-1 text-xs font-medium ${getTierBadgeColor(club.currentUserTier)}`}>
                    {getMembershipTierLabel(club.currentUserTier)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
