/**
 * ServiceListCard Component
 *
 * Card para mostrar un servicio profesional en el listado.
 * Versión adaptada para la página de servicios profesionales.
 */

import { MapPinIcon, StarIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

import { ProfessionalServiceBasic } from '../../interfaces/professional-service.interfaces'

// ============================================================================
// TYPES
// ============================================================================

interface ServiceListCardProps {
  service: ProfessionalServiceBasic
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ServiceListCard({ service, className }: ServiceListCardProps) {
  const {
    slug,
    name,
    description,
    logoUrl,
    adImageUrl,
    address,
    category,
    city,
    user,
    hourlyRate,
    currency,
    availableForHire,
    _count,
    averageRating,
  } = service

  // Format price
  const formattedPrice = hourlyRate
    ? new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: currency || 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(hourlyRate)
    : null

  return (
    <Link
      href={`/feed/professional-services/${slug}`}
      className={cn(
        'group block overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all hover:border-neutral-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700',
        className
      )}
    >
      {/* Cover Image */}
      <div className="aspect-video relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {adImageUrl || logoUrl ? (
          <Image
            src={adImageUrl || logoUrl || ''}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl font-bold text-neutral-300 dark:text-neutral-600">{name.charAt(0)}</span>
          </div>
        )}

        {/* Category Badge */}
        {category && (
          <div className="absolute top-3 left-3">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-neutral-700 backdrop-blur-sm dark:bg-neutral-900/90 dark:text-neutral-300">
              {category.name}
            </span>
          </div>
        )}

        {/* Availability Badge */}
        {availableForHire && (
          <div className="absolute top-3 right-3">
            <span className="rounded-full bg-green-500/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              Disponible
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and Rating */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-lg font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            {name}
          </h3>
          {averageRating && (
            <div className="flex shrink-0 items-center gap-1">
              <StarIcon className="h-4 w-4 fill-primary-400 text-primary-400" />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-xs text-neutral-500">({_count.reviews})</span>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="mb-3 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
            {description.substring(0, 120)}...
          </p>
        )}

        {/* Location */}
        {(city || address) && (
          <div className="mb-3 flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
            <MapPinIcon className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">
              {city?.name}
              {address && `, ${address}`}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
          {/* Owner */}
          {user && (
            <div className="flex items-center gap-2">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={`${user.firstName} ${user.lastName}`}
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                    {user.firstName?.charAt(0)}
                    {user.lastName?.charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {user.firstName} {user.lastName}
              </span>
            </div>
          )}

          {/* Price */}
          {formattedPrice && (
            <div className="text-right">
              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">{formattedPrice}</span>
              <span className="text-xs text-neutral-500">/hora</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
