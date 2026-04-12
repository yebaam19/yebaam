/**
 * Categories React Query Hooks
 *
 * Hooks para operaciones con categorías de servicios
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { categoriesApiClient } from '../api'
import type { ProfessionalServiceCategory } from '../interfaces/professional-service.interfaces'

// Query keys factory
export const categoriesKeys = {
  all: ['professional-service-categories'] as const,
  lists: () => [...categoriesKeys.all, 'list'] as const,
  list: () => [...categoriesKeys.lists()] as const,
  details: () => [...categoriesKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoriesKeys.details(), id] as const,
}

/**
 * Hook para obtener todas las categorías
 */
export function useCategories(
  options?: Omit<
    UseQueryOptions<ProfessionalServiceCategory[]>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: categoriesKeys.list(),
    queryFn: () => categoriesApiClient.getAll(),
    staleTime: 1000 * 60 * 10, // 10 minutos (las categorías no cambian frecuentemente)
    ...options,
  })
}

/**
 * Hook para obtener una categoría por ID
 */
export function useCategory(
  id: string | undefined,
  options?: Omit<
    UseQueryOptions<ProfessionalServiceCategory | null>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: categoriesKeys.detail(id!),
    queryFn: () => categoriesApiClient.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
    ...options,
  })
}
