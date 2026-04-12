import { DIRECTORY_CATEGORIES } from '../../data/mock-directory'
import { DirectoryCategoryCard } from './DirectoryCategoryCard'

interface DirectoryCategoriesGridProps {
  citySlug: string
}

/**
 * Grid de categorías del directorio
 */
export function DirectoryCategoriesGrid({ citySlug }: DirectoryCategoriesGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {DIRECTORY_CATEGORIES.map((category) => (
        <DirectoryCategoryCard key={category.id} category={category} citySlug={citySlug} />
      ))}
    </div>
  )
}
