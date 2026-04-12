/**
 * Services React Query Hooks
 *
 * Hooks para operaciones con servicios profesionales
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { servicesApiClient, type CreateServiceData, type UpdateServiceData } from '../api'
import type {
  ProfessionalServiceDetailResponse,
  ProfessionalServicesListResponse,
  ProfessionalServiceFilters,
  ProfessionalServiceBasic,
} from '../interfaces/professional-service.interfaces'

// Query keys factory
export const servicesKeys = {
  all: ['professional-services'] as const,
  lists: () => [...servicesKeys.all, 'list'] as const,
  list: (filters: ProfessionalServiceFilters) =>
    [...servicesKeys.lists(), filters] as const,
  details: () => [...servicesKeys.all, 'detail'] as const,
  detail: (id: string) => [...servicesKeys.details(), id] as const,
  bySlug: (slug: string) => [...servicesKeys.details(), 'slug', slug] as const,
  search: (query: string) => [...servicesKeys.all, 'search', query] as const,
}

/**
 * Hook para obtener un servicio por ID
 */
export function useService(
  id: string | undefined,
  options?: Omit<
    UseQueryOptions<ProfessionalServiceDetailResponse | null>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: servicesKeys.detail(id!),
    queryFn: () => servicesApiClient.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  })
}

/**
 * Hook para obtener un servicio por slug
 */
export function useServiceBySlug(
  slug: string | undefined,
  options?: Omit<
    UseQueryOptions<ProfessionalServiceDetailResponse | null>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: servicesKeys.bySlug(slug!),
    queryFn: () => servicesApiClient.getBySlug(slug!),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  })
}

/**
 * Hook para obtener lista de servicios con filtros
 */
export function useServices(
  filters: ProfessionalServiceFilters = {},
  options?: Omit<
    UseQueryOptions<ProfessionalServicesListResponse>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: servicesKeys.list(filters),
    queryFn: () => servicesApiClient.list(filters),
    staleTime: 1000 * 60 * 2, // 2 minutos
    ...options,
  })
}

/**
 * Hook para buscar servicios
 */
export function useSearchServices(
  query: string | undefined,
  limit: number = 10,
  options?: Omit<
    UseQueryOptions<ProfessionalServiceBasic[]>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: servicesKeys.search(query || ''),
    queryFn: () => servicesApiClient.search(query!, limit),
    enabled: !!query && query.length >= 2,
    staleTime: 1000 * 60 * 1, // 1 minuto
    ...options,
  })
}

/**
 * Hook para crear un servicio profesional
 */
export function useCreateService(
  options?: UseMutationOptions<ProfessionalServiceDetailResponse, Error, CreateServiceData>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateServiceData) => servicesApiClient.create(data),
    onSuccess: () => {
      // Invalida todas las listas de servicios
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() })
    },
    ...options,
  })
}

/**
 * Hook para actualizar un servicio existente
 */
export function useUpdateService(
  options?: UseMutationOptions<
    ProfessionalServiceDetailResponse,
    Error,
    { id: string; data: UpdateServiceData }
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceData }) =>
      servicesApiClient.update(id, data),
    onSuccess: (_, { id }) => {
      // Invalida el servicio específico y todas las listas
      queryClient.invalidateQueries({ queryKey: servicesKeys.detail(id) })
      // Invalida TODAS las queries de detalles (incluyendo by-slug)
      queryClient.invalidateQueries({ queryKey: servicesKeys.details() })
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() })
    },
    ...options,
  })
}

/**
 * Hook para eliminar un servicio
 */
export function useDeleteService(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => servicesApiClient.delete(id),
    onSuccess: (_, id) => {
      // Invalida el servicio específico y todas las listas
      queryClient.invalidateQueries({ queryKey: servicesKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() })
    },
    ...options,
  })
}
