import {
  AcademicCapIcon,
  BuildingLibraryIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  MapPinIcon,
  SparklesIcon,
} from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import { Category } from '../data/categories'
import type { Route } from 'next';

interface CategoryCardProps {
  citySlug: string
  category: Category
}

/**
 * Mapa de iconos para las categorías
 */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BuildingLibraryIcon,
  CalendarDaysIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
  HomeIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
}

/**
 * Tarjeta de categoría de exploración
 */
export function CategoryCard({ citySlug, category }: CategoryCardProps) {
  const IconComponent = iconMap[category.icon] || MapPinIcon
  const isGreen = category.color === '#16A44C'

  // Las categorías redirigen al directorio de la ciudad
  // donde se muestran negocios, servicios, páginas, etc. filtrados por categoría
  const href = `/cities/${citySlug}/directory`

  return (
    <Link
      href={href as Route}
      className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:border-transparent hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-transparent"
    >
      {/* Icono con fondo */}
      <div
        className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${
          isGreen ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-amber-50 dark:bg-amber-900/30'
        }`}
      >
        <IconComponent
          className={`h-8 w-8 ${
            isGreen ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}
        />
      </div>

      {/* Contenido */}
      <div className="min-w-0 flex-1">
        <h4 className="mb-1 text-base leading-tight font-bold text-neutral-900 dark:text-neutral-100">
          {category.label}
        </h4>
        <p className="line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">{category.description}</p>
      </div>

      {/* Hover effect */}
      <div
        className={`absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-100 ${
          isGreen
            ? 'bg-linear-to-r from-emerald-50 to-transparent dark:from-emerald-900/20'
            : 'bg-linear-to-r from-amber-50 to-transparent dark:from-amber-900/20'
        }`}
      />
    </Link>
  )
}
