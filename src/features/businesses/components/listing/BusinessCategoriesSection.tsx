'use client'

/**
 * BusinessCategoriesSection Component
 *
 * Sección de categorías de negocios con iconos.
 */

import { useBusinessCategories } from '@/features/businesses/hooks'
import { cn } from '@/lib/utils'
import {
  AcademicCapIcon,
  BuildingStorefrontIcon,
  ComputerDesktopIcon,
  HeartIcon,
  HomeModernIcon,
  MusicalNoteIcon,
  ShoppingBagIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'

interface BusinessCategoriesSectionProps {
  selectedCategoryId?: string | null
  onCategorySelect: (categoryId: string | null) => void
}

// Mapeo de categorías a iconos (puedes personalizar según tus categorías)
const categoryIcons: Record<string, React.ElementType> = {
  'cat-bus-1': BuildingStorefrontIcon, // Restaurantes
  'cat-bus-2': ShoppingBagIcon, // Tiendas
  'cat-bus-3': HeartIcon, // Salud y Bienestar
  'cat-bus-4': MusicalNoteIcon, // Entretenimiento
  'cat-bus-5': WrenchScrewdriverIcon, // Automotriz
  'cat-bus-6': AcademicCapIcon, // Educación
  'cat-bus-7': ComputerDesktopIcon, // Tecnología
  'cat-bus-8': HomeModernIcon, // Hotelería
}

export function BusinessCategoriesSection({ selectedCategoryId, onCategorySelect }: BusinessCategoriesSectionProps) {
  const { data: categories = [], isLoading } = useBusinessCategories()

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-800">
        <h3 className="mb-4 font-semibold text-neutral-900 dark:text-neutral-100">Categorías</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-800">
      <h3 className="mb-4 font-semibold text-neutral-900 dark:text-neutral-100">Categorías</h3>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {/* All Categories */}
        <button
          onClick={() => onCategorySelect(null)}
          className={cn(
            'flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-all',
            selectedCategoryId === null
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-700/50 dark:text-neutral-400 dark:hover:bg-neutral-700'
          )}
        >
          <BuildingStorefrontIcon className="h-6 w-6" />
          <span className="text-xs font-medium">Todas</span>
        </button>

        {categories.map((category) => {
          const Icon = categoryIcons[category.id] || BuildingStorefrontIcon
          const isSelected = selectedCategoryId === category.id

          return (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-all',
                isSelected
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-700/50 dark:text-neutral-400 dark:hover:bg-neutral-700'
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="line-clamp-1 text-xs font-medium">{category.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
