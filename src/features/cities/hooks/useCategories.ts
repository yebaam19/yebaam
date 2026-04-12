import { useQuery } from '@tanstack/react-query'
import { cityCategoryService, type CityCategory } from '../services/city-category.service'

/**
 * Hook para obtener las categorías activas de ciudades
 * Usa React Query para caching y gestión de estado
 */
export function useActiveCategories() {
  return useQuery({
    queryKey: ['city-categories', 'active'],
    queryFn: () => cityCategoryService.getActiveCategories(),
    staleTime: 1000 * 60 * 30, // 30 minutos - las categorías no cambian frecuentemente
    gcTime: 1000 * 60 * 60, // 1 hora en cache
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook para obtener una categoría por slug
 */
export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: ['city-categories', 'slug', slug],
    queryFn: () => cityCategoryService.getCategoryBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 2,
  })
}

/**
 * Mapea una categoría de la API al formato del menú
 */
export function mapCategoryToMenuItem(category: CityCategory) {
  return {
    id: category.slug,
    label: category.name,
    icon: category.icon,
    color: category.color,
    link: `/feed/cities/:city/categoria/${category.slug}`,
    description: category.description,
  }
}
