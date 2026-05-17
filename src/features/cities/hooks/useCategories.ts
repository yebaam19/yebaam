'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { cityCategoryService, type CityCategory } from '../services/city-category.service';

/**
 * Hook para obtener las categorías activas de ciudades
 */
export function useActiveCategories() {
  return useFetch(
    ['city-categories', 'active'],
    () => cityCategoryService.getActiveCategories(),
    { staleTime: 1000 * 60 * 30 }
  );
}

/**
 * Hook para obtener una categoría por slug
 */
export function useCategoryBySlug(slug: string) {
  return useFetch(
    ['city-categories', 'slug', slug],
    () => cityCategoryService.getCategoryBySlug(slug),
    { enabled: !!slug, staleTime: 1000 * 60 * 30 }
  );
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
    link: `/cities/:city/categoria/${category.slug}`,
    description: category.description,
  };
}
