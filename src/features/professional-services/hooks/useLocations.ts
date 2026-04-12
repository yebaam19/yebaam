/**
 * Locations React Query Hooks
 *
 * Hooks para operaciones con estados y ciudades
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { locationsApiClient } from '../api'
import type { State, City, LocationFiltersData } from '../interfaces/professional-service.interfaces'

// Query keys factory
export const locationsKeys = {
  all: ['professional-service-locations'] as const,
  states: () => [...locationsKeys.all, 'states'] as const,
  cities: () => [...locationsKeys.all, 'cities'] as const,
  citiesByState: (stateId: string) => [...locationsKeys.cities(), 'state', stateId] as const,
  filters: () => [...locationsKeys.all, 'filters'] as const,
}

/**
 * Hook para obtener todos los estados
 */
export function useStates(
  options?: Omit<UseQueryOptions<State[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: locationsKeys.states(),
    queryFn: () => locationsApiClient.getStates(),
    staleTime: 1000 * 60 * 30, // 30 minutos (los estados no cambian)
    ...options,
  })
}

/**
 * Hook para obtener ciudades de un estado
 */
export function useCitiesByState(
  stateId: string | undefined,
  options?: Omit<UseQueryOptions<City[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: locationsKeys.citiesByState(stateId!),
    queryFn: () => locationsApiClient.getCitiesByState(stateId!),
    enabled: !!stateId,
    staleTime: 1000 * 60 * 30, // 30 minutos
    ...options,
  })
}

/**
 * Hook para obtener todas las ciudades
 */
export function useAllCities(
  options?: Omit<UseQueryOptions<City[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: locationsKeys.cities(),
    queryFn: () => locationsApiClient.getAllCities(),
    staleTime: 1000 * 60 * 30, // 30 minutos
    ...options,
  })
}

/**
 * Hook para obtener datos de filtros de ubicación
 */
export function useLocationFilters(
  options?: Omit<UseQueryOptions<LocationFiltersData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: locationsKeys.filters(),
    queryFn: () => locationsApiClient.getLocationFiltersData(),
    staleTime: 1000 * 60 * 30, // 30 minutos
    ...options,
  })
}
