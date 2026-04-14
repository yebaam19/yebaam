'use client'

import { useActiveCategories, mapCategoryToMenuItem } from '../hooks/useCategories'
import { CategoryCard } from './CategoryCard'

interface CategoriesGridProps {
  citySlug: string
}

/**
 * Grid de categorías para explorar la ciudad
 */
export function CategoriesGrid({ citySlug }: CategoriesGridProps) {
  const { data: categoriesRaw, isLoading, error } = useActiveCategories()

  const categories = categoriesRaw ?? []

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
        Error al cargar las categorías. Por favor intenta de nuevo.
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        No hay categorías disponibles en este momento.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          citySlug={citySlug}
          category={{
            id: category.slug,
            label: category.name,
            icon: category.icon,
            color: category.color,
            description: category.description,
          }}
        />
      ))}
    </div>
  )
}
