import { MapPinIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'

interface ServiceLocationProps {
  citySlug: string
  cityName: string
  stateName?: string
  availableForHire?: boolean
}

/**
 * Ubicación y disponibilidad del servicio
 */
export function ServiceLocation({ citySlug, cityName, stateName, availableForHire }: ServiceLocationProps) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-700">
      <Link
        href={`/feed/cities/${citySlug}`}
        className="flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
      >
        <MapPinIcon className="h-4 w-4" />
        <span>
          {cityName}
          {stateName && `, ${stateName}`}
        </span>
      </Link>

      {availableForHire && (
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
          Disponible
        </span>
      )}
    </div>
  )
}
