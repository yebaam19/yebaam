'use client'

/**
 * BusinessOwnerCard Component
 *
 * Tarjeta de información del propietario del negocio.
 */

import { CheckBadgeIcon, EnvelopeIcon, UserIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import Link from 'next/link'
import type { BusinessOwner } from '../../interfaces/business.interfaces'

interface BusinessOwnerCardProps {
  owner: BusinessOwner
  /** Fecha de creación del negocio */
  createdAt: Date
  /** Nombre del negocio */
  businessName: string
}

/**
 * Tarjeta con información del propietario del negocio
 */
export function BusinessOwnerCard({ owner, createdAt, businessName }: BusinessOwnerCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es', {
      year: 'numeric',
      month: 'long',
    }).format(new Date(date))
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
          <UserIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Propietario</h2>
      </div>

      {/* Owner Info */}
      <div className="mt-4 flex items-center gap-4">
        {/* Avatar */}
        <Link
          href={`/user/${owner.username}`}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-200 ring-2 ring-primary-100 ring-offset-2 transition-all hover:ring-primary-300 dark:bg-neutral-700 dark:ring-primary-900/30 dark:hover:ring-primary-700"
        >
          {owner.avatarUrl ? (
            <Image src={owner.avatarUrl} alt={owner.username} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-amber-400 to-yellow-500 text-2xl font-bold text-white">
              {owner.username.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        {/* User Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <Link
              href={`/user/${owner.username}`}
              className="font-semibold text-neutral-900 hover:text-primary-600 dark:text-neutral-100 dark:hover:text-primary-400"
            >
              {owner.username}
            </Link>
            {owner.isVerified && <CheckBadgeIcon className="h-5 w-5 text-primary-500" title="Usuario verificado" />}
          </div>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">Propietario de {businessName}</p>
          <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">Miembro desde {formatDate(createdAt)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Link
          href={`/user/${owner.username}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          <UserIcon className="h-4 w-4" />
          Ver perfil
        </Link>
        <button
          className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
          onClick={() => {
            // TODO: Implementar funcionalidad de mensaje
            console.log('Enviar mensaje a', owner.username)
          }}
        >
          <EnvelopeIcon className="h-4 w-4" />
          Mensaje
        </button>
      </div>
    </div>
  )
}
