'use client'

/**
 * BusinessHeader Component
 *
 * Header del perfil del negocio con cover, logo e información básica.
 */

import { Cog6ToothIcon, ShareIcon } from '@/components/icons/heroicons-shim'
import { CheckBadgeIcon, EnvelopeIcon, GlobeAltIcon, MapPinIcon, PhoneIcon, StarIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Business, BUSINESS_STATUS_LABELS, BusinessStatus } from '../../interfaces/business.interfaces'
import { EditBusinessModal } from './EditBusinessModal'

interface BusinessHeaderProps {
  business: Business
  /** ID del usuario actual para determinar si es el dueño */
  currentUserId?: string
}

/**
 * Iconos de redes sociales
 */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 36.6 36.6 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
    </svg>
  )
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  )
}

/**
 * Header del perfil del negocio
 */
export function BusinessHeader({ business, currentUserId }: BusinessHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Determinar si el usuario actual es el dueño del negocio
  const isOwner = currentUserId && currentUserId === business.userId

  const socialLinks = [
    { url: business.facebookUrl, icon: FacebookIcon, label: 'Facebook', color: 'hover:text-blue-600' },
    { url: business.instagramUrl, icon: InstagramIcon, label: 'Instagram', color: 'hover:text-pink-600' },
    {
      url: business.twitterUrl,
      icon: TwitterIcon,
      label: 'Twitter',
      color: 'hover:text-neutral-900 dark:hover:text-white',
    },
    { url: business.linkedinUrl, icon: LinkedInIcon, label: 'LinkedIn', color: 'hover:text-blue-700' },
    { url: business.youtubeUrl, icon: YouTubeIcon, label: 'YouTube', color: 'hover:text-red-600' },
    {
      url: business.tiktokUrl,
      icon: TikTokIcon,
      label: 'TikTok',
      color: 'hover:text-neutral-900 dark:hover:text-white',
    },
  ].filter((link) => link.url)

  const statusInfo = BUSINESS_STATUS_LABELS[business.status as BusinessStatus]

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-neutral-800">
      {/* Cover Image */}
      <div className="relative h-48 bg-linear-to-r from-amber-500 to-yellow-600 sm:h-64">
        {business.coverUrl && (
          <Image src={business.coverUrl} alt={`Cover de ${business.name}`} fill className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              business.status === BusinessStatus.ACTIVE
                ? 'bg-green-100 text-green-800'
                : business.status === BusinessStatus.PENDING_APPROVAL
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-neutral-100 text-neutral-800'
            }`}
          >
            {statusInfo?.label}
          </span>
        </div>
      </div>

      {/* Profile Info */}
      <div className="relative px-4 pb-6 sm:px-6">
        {/* Logo/Avatar */}
        <div className="relative -mt-16 mb-4 sm:-mt-20">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border-4 border-white bg-white shadow-lg sm:h-36 sm:w-36 dark:border-neutral-800 dark:bg-neutral-700">
            {business.logoUrl ? (
              <Image src={business.logoUrl} alt={business.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-amber-100 text-4xl font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                {business.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Business Info and Actions */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          {/* Business Name and Info */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl dark:text-neutral-100">{business.name}</h1>
              {business.user?.isVerified && (
                <CheckBadgeIcon className="h-5 w-5 text-primary-500 sm:h-6 sm:w-6" title="Verificado" />
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                {business.category.name}
              </span>

              {business.averageRating && (
                <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{business.averageRating.toFixed(1)}</span>
                  <span className="text-neutral-400">({business._count.reviews} reseñas)</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isOwner ? (
              <>
                {/* Owner actions */}
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2 font-medium text-neutral-900 transition-colors hover:bg-neutral-200 dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600"
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Configuración</span>
                  <span className="sm:hidden">Config</span>
                </button>
              </>
            ) : (
              <>
                {/* Visitor actions */}
                <button className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700">
                  <EnvelopeIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Contactar</span>
                </button>
              </>
            )}

            {/* Share button (for everyone) */}
            <button
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: business.name,
                      text: business.description || `Mira este negocio: ${business.name}`,
                      url: window.location.href,
                    })
                  } catch {
                    /* user aborted share sheet */
                  }
                  return
                }
                const { copyToClipboard } = await import('@/lib/clipboard')
                if (await copyToClipboard(window.location.href)) {
                  alert('Enlace copiado al portapapeles')
                }
              }}
              className="rounded-lg bg-gray-100 p-2 text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              title="Compartir negocio"
            >
              <ShareIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {business.address && (
            <Link
              href={`https://maps.google.com/?q=${encodeURIComponent(business.address)}`}
              target="_blank"
              className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
            >
              <MapPinIcon className="h-5 w-5 shrink-0" />
              <span className="line-clamp-1">{business.address}</span>
            </Link>
          )}

          {business.email && (
            <Link
              href={`mailto:${business.email}`}
              className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
            >
              <EnvelopeIcon className="h-5 w-5 shrink-0" />
              <span className="line-clamp-1">{business.email}</span>
            </Link>
          )}

          {business.phone && (
            <Link
              href={`tel:${business.phone}`}
              className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
            >
              <PhoneIcon className="h-5 w-5 shrink-0" />
              <span>{business.phone}</span>
            </Link>
          )}

          {business.website && (
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
            >
              <GlobeAltIcon className="h-5 w-5 shrink-0" />
              <span className="line-clamp-1">{new URL(business.website).hostname}</span>
            </a>
          )}
        </div>

        {/* Tags */}
        {business.tags && business.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {business.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="mt-4 flex items-center gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <span className="text-sm font-medium text-neutral-500">Síguenos:</span>
            <div className="flex gap-2">
              {socialLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors dark:bg-neutral-700 dark:text-neutral-400 ${link.color}`}
                      aria-label={link.label}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  )
                })}
            </div>
          </div>
        )}

        {/* City Link */}
        <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <Link
            href={`/feed/cities/${business.city.slug}`}
            className="flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
          >
            <MapPinIcon className="h-4 w-4" />
            <span>
              {business.city.name}
              {business.city.state && `, ${business.city.state.name}`}
            </span>
          </Link>
        </div>
      </div>

      {/* Modal de Edición */}
      {isOwner && <EditBusinessModal business={business} open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />}
    </div>
  )
}
