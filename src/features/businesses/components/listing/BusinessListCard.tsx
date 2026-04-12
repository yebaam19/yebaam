'use client'

/**
 * BusinessListCard Component
 *
 * Tarjeta para mostrar un negocio en el listado.
 */

import { MapPinIcon, StarIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'
import Link from 'next/link'
import { BusinessBasic } from '../../interfaces/business.interfaces'

interface BusinessListCardProps {
  business: BusinessBasic
}

export function BusinessListCard({ business }: BusinessListCardProps) {
  return (
    <Link
      href={`/feed/businesses/${business.slug}`}
      className="group block overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-md dark:bg-neutral-800"
    >
      {/* Cover/Ad Image */}
      <div className="aspect-video relative overflow-hidden bg-linear-to-br from-amber-500 to-yellow-600">
        {business.adImageUrl ? (
          <Image
            src={business.adImageUrl}
            alt={business.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl font-bold text-white/50">{business.name.charAt(0)}</span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-neutral-800 backdrop-blur-sm">
            {business.category.name}
          </span>
        </div>

        {/* Rating Badge */}
        {business.averageRating && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm">
            <StarIcon className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-xs font-medium text-white">{business.averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-3 flex items-start gap-3">
          {/* Logo */}
          {business.logoUrl ? (
            <Image
              src={business.logoUrl}
              alt={business.name}
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-xl object-cover ring-2 ring-neutral-100 dark:ring-neutral-700"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl font-bold text-amber-600 ring-2 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-900/50">
              {business.name.charAt(0)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-base leading-tight font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-neutral-100 dark:group-hover:text-primary-400">
              {business.name}
            </h3>

            {business.city && (
              <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
                <MapPinIcon className="h-3.5 w-3.5" />
                <span>{business.city.name}</span>
              </div>
            )}
          </div>
        </div>

        {business.description && (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            {business.description}
          </p>
        )}

        {/* Stats */}
        <div className="mb-4 flex items-center gap-4 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-700/50">
          <div className="flex items-center gap-1.5 text-sm">
            <StarIcon className="h-4 w-4 text-amber-500" />
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{business._count.reviews}</span>
            <span className="text-neutral-500 dark:text-neutral-400">reseñas</span>
          </div>
          <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-600" />
          <div className="flex items-center gap-1.5 text-sm">
            <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{business._count.media}</span>
            <span className="text-neutral-500 dark:text-neutral-400">fotos</span>
          </div>
        </div>

        {/* Owner */}
        {business.user && (
          <div className="flex items-center gap-2.5 border-t border-neutral-100 pt-3 dark:border-neutral-700">
            {business.user.avatarUrl ? (
              <Image
                src={business.user.avatarUrl}
                alt={business.user.firstName || 'User'}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover ring-2 ring-neutral-100 dark:ring-neutral-700"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-600 ring-2 ring-neutral-100 dark:bg-neutral-600 dark:text-neutral-300 dark:ring-neutral-700">
                {business.user.firstName?.charAt(0) || '?'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {business.user.firstName} {business.user.lastName}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Propietario</p>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
