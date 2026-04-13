import { slugify } from '@/lib/utils'
import { MapPinIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import { CityBasic } from '../interfaces/city.interfaces'

interface CityCardProps {
  city: CityBasic
}

/**
 * Tarjeta individual de ciudad para el grid
 */
export function CityCard({ city }: CityCardProps) {
  return (
    <Link
      href={`/feed/cities/${slugify(city.name)}`}
      className="group block rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-primary-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-primary-600"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400">
          <MapPinIcon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-neutral-100 dark:group-hover:text-primary-400">
            {city.name}
          </h3>
          <p className="mt-0.5 truncate text-sm text-neutral-500 dark:text-neutral-400">
            {city.state?.name ? `${city.state.name}, ` : ''}
            {city.country.name}
          </p>
        </div>
      </div>
    </Link>
  )
}
