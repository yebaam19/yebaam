'use client'

import { ArrowLeftIcon, ShareIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'

interface ServiceBreadcrumbProps {
  cityName: string
  citySlug: string
  serviceName: string
}

/**
 * Breadcrumb de navegación para el servicio profesional
 */
export function ServiceBreadcrumb({ cityName, citySlug, serviceName }: ServiceBreadcrumbProps) {
  return (
    <nav className="mb-4">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <li>
          <Link
            href="/feed/professional-services"
            className="flex items-center gap-1 transition-colors hover:text-primary-600 dark:hover:text-primary-400"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Servicios Profesionales</span>
          </Link>
        </li>

        <li className="text-neutral-400">/</li>

        <li>
          <Link
            href={`/feed/cities/${citySlug}`}
            className="transition-colors hover:text-primary-600 dark:hover:text-primary-400"
          >
            {cityName}
          </Link>
        </li>

        <li className="text-neutral-400">/</li>

        <li className="truncate font-medium text-neutral-900 dark:text-neutral-100">{serviceName}</li>
      </ol>
    </nav>
  )
}

interface ServiceActionsProps {
  serviceId: string
  serviceName: string
}

/**
 * Acciones del servicio (compartir, guardar, etc.)
 */
export function ServiceActions({ serviceId, serviceName }: ServiceActionsProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: serviceName,
          text: `Mira este servicio profesional: ${serviceName}`,
          url: window.location.href,
        })
      } catch (error) {
        // Usuario canceló o error
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback: copiar al clipboard
      await navigator.clipboard.writeText(window.location.href)
      // Aquí podrías mostrar un toast de confirmación
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleShare}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
        aria-label="Compartir"
      >
        <ShareIcon className="h-5 w-5" />
      </button>
    </div>
  )
}
