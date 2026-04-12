import {
  AcademicCapIcon,
  BriefcaseIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  FilmIcon,
  HeartIcon,
  HomeModernIcon,
  RocketLaunchIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { DirectoryCategory, DirectoryCategoryType } from '../../interfaces/directory.interfaces'

interface DirectoryCategoryCardProps {
  category: DirectoryCategory
  citySlug: string
}

/**
 * Mapa de iconos para las categorías del directorio
 */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Squares2X2Icon,
  BuildingStorefrontIcon,
  BriefcaseIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  HomeModernIcon,
  HeartIcon,
  BuildingOffice2Icon,
  FilmIcon,
}

/**
 * Tarjeta de categoría del directorio
 */
export function DirectoryCategoryCard({ category, citySlug }: DirectoryCategoryCardProps) {
  const IconComponent = iconMap[category.icon] || Squares2X2Icon

  const getHref = () => {
    if (category.type === DirectoryCategoryType.BUSINESS) {
      return `/feed/businesses?city=${citySlug}`
    } else if (category.type === DirectoryCategoryType.SERVICE) {
      return `/feed/professional-services?city=${citySlug}`
    }
    return `/feed/cities/${citySlug}/directory`
  }

  const isGreen = category.color === '#16A44C'

  return (
    <Link href={getHref()} className="group block">
      <div className="relative flex h-full flex-col items-center gap-3 overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-transparent hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-transparent">
        {/* Icono con fondo */}
        <div
          className={`relative flex h-20 w-20 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${
            isGreen ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-amber-50 dark:bg-amber-900/30'
          }`}
        >
          <IconComponent
            className={`h-10 w-10 ${
              isGreen ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}
          />
        </div>

        {/* Título */}
        <h4 className="text-center text-sm leading-tight font-semibold text-neutral-900 dark:text-neutral-100">
          {category.label}
        </h4>

        {/* Hover effect */}
        <div
          className={`absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-100 ${
            isGreen
              ? 'bg-linear-to-br from-emerald-50 to-transparent dark:from-emerald-900/20'
              : 'bg-linear-to-br from-amber-50 to-transparent dark:from-amber-900/20'
          }`}
        />
      </div>
    </Link>
  )
}
