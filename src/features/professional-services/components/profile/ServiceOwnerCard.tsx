import { CheckBadgeIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import Link from 'next/link'
import { ServiceOwner } from '../../interfaces/professional-service.interfaces'

interface ServiceOwnerCardProps {
  owner?: ServiceOwner
}

/**
 * Tarjeta del propietario/profesional del servicio
 */
export function ServiceOwnerCard({ owner }: ServiceOwnerCardProps) {
  if (!owner) {
    return null
  }

  // Verificar si el owner tiene datos válidos
  const hasValidData = owner.firstName && owner.lastName && owner.username
  const displayName = hasValidData 
    ? `${owner.firstName} ${owner.lastName}` 
    : 'Usuario sin nombre'
  const displayUsername = owner.username || 'usuario'
  const initials = hasValidData && owner.firstName && owner.lastName
    ? `${owner.firstName.charAt(0)}${owner.lastName.charAt(0)}`
    : '?'

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Profesional</h2>

      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          {owner.avatarUrl ? (
            <Image src={owner.avatarUrl} alt={displayName} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-neutral-500">
              {initials}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
              {displayName}
            </h3>
            {owner.isVerified && <CheckBadgeIcon className="h-5 w-5 shrink-0 text-primary-500" title="Verificado" />}
          </div>

          <p className="text-sm text-neutral-500 dark:text-neutral-400">@{displayUsername}</p>
        </div>
      </div>

      {/* Botón de contacto */}
      <div className="mt-4">
        <Link
          href={`/feed/professional-profile/${displayUsername}`}
          className="block w-full rounded-lg bg-primary-500 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-600"
        >
          Ver perfil profesional
        </Link>
      </div>
    </div>
  )
}
