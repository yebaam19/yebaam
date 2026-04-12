import Image from 'next/image';
import { Club } from '@/features/clubs/types/club.types';
import { formatMembersCount } from '@/features/clubs/utils/clubHelpers';

interface ClubSidebarProps {
  club: Club;
}

/**
 * Componente para la barra lateral con información adicional del club
 * Muestra: estadísticas y información del propietario
 */
export function ClubSidebar({ club }: ClubSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Estadísticas
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Miembros</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatMembersCount(club.stats.membersCount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Eventos</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {club.stats.eventsCount || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Publicaciones</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {club.stats.postsCount || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Miembros Activos</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {club.stats.activeMembers || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Owner Card */}
      {club.ownerName && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Propietario
          </h3>
          <div className="flex items-center gap-3">
            {club.ownerAvatar ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                <Image
                  src={club.ownerAvatar}
                  alt={club.ownerName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center shrink-0">
                <span className="text-white font-semibold text-lg">
                  {club.ownerName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {club.ownerName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fundador</p>
            </div>
          </div>
        </div>
      )}

      {/* Membership Tiers Card */}
      {club.membershipTiers && club.membershipTiers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Niveles de Membresía
          </h3>
          <div className="space-y-2">
            {club.membershipTiers.map((tier, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {tier}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Disponible
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
