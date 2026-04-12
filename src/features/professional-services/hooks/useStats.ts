/**
 * Stats React Query Hooks
 *
 * Hooks para estadísticas y servicios destacados
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { statsApiClient } from '../api'
import type { ProfessionalServiceBasic } from '../interfaces/professional-service.interfaces'

interface ServiceStatsResponse {
  totalReviews: number
  averageRating: number
  totalMedia: number
}

// Query keys factory
export const statsKeys = {
  all: ['professional-service-stats'] as const,
  serviceStats: (serviceId: string) => [...statsKeys.all, 'service', serviceId] as const,
  featured: (limit: number) => [...statsKeys.all, 'featured', limit] as const,
  recent: (limit: number) => [...statsKeys.all, 'recent', limit] as const,
}

/**
 * Hook para obtener estadísticas de un servicio
 */
export function useServiceStats(
  serviceId: string | undefined,
  options?: Omit<UseQueryOptions<ServiceStatsResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: statsKeys.serviceStats(serviceId!),
    queryFn: () => statsApiClient.getServiceStats(serviceId!),
    enabled: !!serviceId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  })
}

/**
 * Hook para obtener servicios destacados
 */
export function useFeaturedServices(
  limit: number = 6,
  options?: Omit<UseQueryOptions<ProfessionalServiceBasic[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: statsKeys.featured(limit),
    queryFn: () => statsApiClient.getFeaturedServices(limit),
    staleTime: 1000 * 60 * 10, // 10 minutos
    ...options,
  })
}

/**
 * Hook para obtener servicios recientes
 */
export function useRecentServices(
  limit: number = 10,
  options?: Omit<UseQueryOptions<ProfessionalServiceBasic[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: statsKeys.recent(limit),
    queryFn: () => statsApiClient.getRecentServices(limit),
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  })
}
