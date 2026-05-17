'use client'

/**
 * BusinessProfileContainer Component
 *
 * Contenedor principal de la página de perfil de un negocio.
 */

import { ChevronRightIcon, HomeIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import { Business } from '../../interfaces/business.interfaces'
import {
  AboutBusiness,
  BusinessHeader,
  BusinessHours,
  BusinessMediaGallery,
  BusinessOwnerCard,
  BusinessReviews,
} from '../profile'

interface BusinessProfileContainerProps {
  /** Datos del negocio */
  business: Business
  /** ID del usuario actual (opcional) */
  currentUserId?: string
}

/**
 * Contenedor del perfil del negocio
 */
export function BusinessProfileContainer({ business, currentUserId }: BusinessProfileContainerProps) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/feed"
            className="flex items-center gap-1 text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
          >
            <HomeIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
          <ChevronRightIcon className="h-4 w-4 text-neutral-400" />
          <Link
            href="/feed/businesses"
            className="text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
          >
            Negocios
          </Link>
          <ChevronRightIcon className="h-4 w-4 text-neutral-400" />
          <Link
            href={`/cities/${business.city.slug}`}
            className="text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
          >
            {business.city.name}
          </Link>
          <ChevronRightIcon className="h-4 w-4 text-neutral-400" />
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{business.name}</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {/* Header */}
        <BusinessHeader business={business} currentUserId={currentUserId} />

        {/* Content Grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Main Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* About */}
            <AboutBusiness description={business.description} />

            {/* Media Gallery */}
            <BusinessMediaGallery media={business.media} businessName={business.name} />

            {/* Reviews */}
            <BusinessReviews
              reviews={business.reviews}
              averageRating={business.averageRating}
              totalReviews={business._count.reviews}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Card */}
            {business.user && (
              <BusinessOwnerCard owner={business.user} createdAt={business.createdAt} businessName={business.name} />
            )}

            {/* Business Hours */}
            <BusinessHours hours={business.hours as Record<string, string> | null} />

            {/* Related Businesses Placeholder */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <h3 className="mb-4 font-semibold text-neutral-900 dark:text-neutral-100">Negocios relacionados</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Próximamente mostraremos negocios similares en tu zona.
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 border-t border-neutral-200 pt-8 dark:border-neutral-700">
          <Link
            href="/feed/businesses"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            <ChevronRightIcon className="h-4 w-4 rotate-180" />
            Volver al listado de negocios
          </Link>
        </div>
      </div>
    </div>
  )
}
