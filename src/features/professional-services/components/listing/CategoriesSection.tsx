/**
 * CategoriesSection Component
 *
 * Sección de categorías para la página de servicios profesionales.
 */

'use client'

import {
  AcademicCapIcon,
  BoltIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  HeartIcon,
  PaintBrushIcon,
  ScaleIcon,
} from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import { ComponentType, SVGProps } from 'react'

import { cn } from '@/lib/utils'

import { PROFESSIONAL_SERVICES_PATH } from '../../constants/routes'
import { ProfessionalServiceCategory } from '../../interfaces/professional-service.interfaces'

// ============================================================================
// TYPES
// ============================================================================

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>

interface CategoriesSectionProps {
  categories: ProfessionalServiceCategory[]
  onCategorySelect?: (categoryId: string) => void
  className?: string
}

// ============================================================================
// ICON MAP
// ============================================================================

// Iconos por id de categoría de la taxonomía (service-categories-taxonomy).
// Las categorías sin entrada usan DEFAULT_ICON.
const CATEGORY_ICONS: Record<string, HeroIcon> = {
  'cat-servicios-legales': ScaleIcon,
  'cat-finanzas-y-contabilidad': BriefcaseIcon,
  'cat-arquitectura-y-construccion': BuildingOfficeIcon,
  'cat-salud': HeartIcon,
  'cat-tecnologia-e-informatica': CodeBracketIcon,
  'cat-diseno-y-creatividad': PaintBrushIcon,
  'cat-ingenieria': BoltIcon,
  'cat-educacion-y-formacion': AcademicCapIcon,
}

const DEFAULT_ICON: HeroIcon = BriefcaseIcon

// ============================================================================
// COMPONENT
// ============================================================================

export function CategoriesSection({ categories, onCategorySelect, className }: CategoriesSectionProps) {
  return (
    <section className={cn('py-12', className)}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Explora por Categoría</h2>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Encuentra profesionales especializados en lo que necesitas
          </p>
        </div>
        <Link
          href={PROFESSIONAL_SERVICES_PATH}
          className="hidden items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 sm:flex dark:text-primary-400 dark:hover:text-primary-300"
        >
          Ver todos
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            Icon={CATEGORY_ICONS[category.id] ?? DEFAULT_ICON}
            onClick={() => onCategorySelect?.(category.id)}
          />
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface CategoryCardProps {
  category: ProfessionalServiceCategory
  Icon: HeroIcon
  onClick?: () => void
}

function CategoryCard({ category, Icon, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center rounded-xl border border-neutral-200 bg-white p-6 text-center transition-all hover:border-primary-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 transition-colors group-hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:group-hover:bg-primary-900/50">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
        {category.name}
      </h3>
      {category.description && (
        <p className="mt-1 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">{category.description}</p>
      )}
    </button>
  )
}
