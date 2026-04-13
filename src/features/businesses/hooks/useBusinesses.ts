import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { businessService } from '../services/business.service';
import {
  BusinessBasic,
  BusinessDetailResponse,
  BusinessesListResponse,
  BusinessFilters,
  BusinessCategory,
  LocationFiltersData,
  State,
  City,
} from '../interfaces/business.interfaces';

/**
 * Query Keys para TanStack Query
 * Centralizados para mejor mantenimiento
 */
export const businessKeys = {
  all: ['businesses'] as const,
  lists: () => [...businessKeys.all, 'list'] as const,
  list: (filters: BusinessFilters) => [...businessKeys.lists(), filters] as const,
  details: () => [...businessKeys.all, 'detail'] as const,
  detail: (id: string) => [...businessKeys.details(), id] as const,
  detailBySlug: (slug: string) => [...businessKeys.details(), 'slug', slug] as const,
  categories: () => [...businessKeys.all, 'categories'] as const,
  category: (id: string) => [...businessKeys.categories(), id] as const,
  locations: () => [...businessKeys.all, 'locations'] as const,
  states: () => [...businessKeys.locations(), 'states'] as const,
  cities: (stateId?: string) => [...businessKeys.locations(), 'cities', stateId] as const,
  quickSearch: (query: string) => [...businessKeys.all, 'quick-search', query] as const,
};

/**
 * Hook para obtener lista de negocios con filtros y paginación
 */
export function useBusinesses(filters: BusinessFilters = {}) {
  return useQuery<BusinessesListResponse>({
    queryKey: businessKeys.list(filters),
    queryFn: () => businessService.getBusinesses(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos (anteriormente cacheTime)
  });
}

/**
 * Hook para obtener negocio por ID
 */
export function useBusinessById(id: string) {
  return useQuery<BusinessDetailResponse | null>({
    queryKey: businessKeys.detail(id),
    queryFn: () => businessService.getBusinessById(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
}

/**
 * Hook para obtener negocio por slug
 * Usado en páginas públicas con URLs amigables
 */
export function useBusinessBySlug(slug: string) {
  return useQuery<BusinessDetailResponse | null>({
    queryKey: businessKeys.detailBySlug(slug),
    queryFn: () => businessService.getBusinessBySlug(slug),
    staleTime: 1000 * 60 * 5,
    enabled: !!slug,
  });
}

/**
 * Hook para obtener negocios por ciudad
 */
export function useBusinessesByCity(cityId: string, filters: Omit<BusinessFilters, 'cityId'> = {}) {
  return useQuery<BusinessesListResponse>({
    queryKey: businessKeys.list({ ...filters, cityId }),
    queryFn: () => businessService.getBusinessesByCity(cityId, filters),
    staleTime: 1000 * 60 * 5,
    enabled: !!cityId,
  });
}

/**
 * Hook para obtener negocios por categoría
 */
export function useBusinessesByCategory(categoryId: string, filters: Omit<BusinessFilters, 'categoryId'> = {}) {
  return useQuery<BusinessesListResponse>({
    queryKey: businessKeys.list({ ...filters, categoryId }),
    queryFn: () => businessService.getBusinessesByCategory(categoryId, filters),
    staleTime: 1000 * 60 * 5,
    enabled: !!categoryId,
  });
}

/**
 * Hook para obtener todas las categorías
 */
export function useBusinessCategories() {
  return useQuery<BusinessCategory[]>({
    queryKey: businessKeys.categories(),
    queryFn: () => businessService.getCategories(),
    staleTime: 1000 * 60 * 30, // 30 minutos (las categorías cambian poco)
  });
}

/**
 * Hook para obtener categoría por ID
 */
export function useBusinessCategory(id: string) {
  return useQuery<BusinessCategory | null>({
    queryKey: businessKeys.category(id),
    queryFn: () => businessService.getCategoryById(id),
    staleTime: 1000 * 60 * 30,
    enabled: !!id,
  });
}

/**
 * Hook para obtener datos de ubicación (estados y ciudades)
 */
export function useLocationFilters() {
  return useQuery<LocationFiltersData>({
    queryKey: businessKeys.locations(),
    queryFn: () => businessService.getLocationFilters(),
    staleTime: 1000 * 60 * 30, // 30 minutos
  });
}

/**
 * Hook para obtener todos los estados
 */
export function useStates() {
  return useQuery<State[]>({
    queryKey: businessKeys.states(),
    queryFn: () => businessService.getStates(),
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * Hook para obtener ciudades por estado
 */
export function useCitiesByState(stateId?: string) {
  return useQuery<City[]>({
    queryKey: businessKeys.cities(stateId),
    queryFn: () => businessService.getCitiesByState(stateId!),
    staleTime: 1000 * 60 * 30,
    enabled: !!stateId,
  });
}

/**
 * Hook para búsqueda rápida (autocompletado)
 * Usar con debounce para mejor performance
 */
export function useQuickSearch(query: string, limit: number = 5) {
  return useQuery<BusinessBasic[]>({
    queryKey: businessKeys.quickSearch(query),
    queryFn: () => businessService.quickSearch(query, limit),
    staleTime: 1000 * 60, // 1 minuto
    enabled: query.length >= 2, // Solo buscar con mínimo 2 caracteres
  });
}

/**
 * Hook para crear reseña
 * Mutation con invalidación automática de caché
 */
export function useCreateReview(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (review: { rating: number; title?: string; comment?: string }) =>
      businessService.createReview(businessId, review),
    onSuccess: () => {
      // Invalidar caché del negocio para refrescar datos
      queryClient.invalidateQueries({ queryKey: businessKeys.detail(businessId) });
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    },
  });
}

/**
 * Hook personalizado para búsqueda con múltiples filtros
 * Útil para páginas de búsqueda/filtrado avanzado
 */
export function useBusinessSearch(
  search?: string,
  categoryId?: string,
  cityId?: string,
  stateId?: string,
  minRating?: number,
  page: number = 1,
  limit: number = 10
) {
  const filters: BusinessFilters = {
    search,
    categoryId,
    cityId,
    stateId,
    minRating,
    page,
    limit,
  };

  return useBusinesses(filters);
}

/**
 * Hook para crear un nuevo negocio
 * Mutation con invalidación automática de caché
 */
export function useCreateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (businessData: {
      name: string;
      description?: string;
      categoryId: string;
      cityId: string;
      address?: string;
      email?: string;
      phone?: string;
      website?: string;
      facebookUrl?: string;
      instagramUrl?: string;
      twitterUrl?: string;
      linkedinUrl?: string;
      youtubeUrl?: string;
      tiktokUrl?: string;
      logoUrl?: string;
      coverUrl?: string;
      adImageUrl?: string;
    }) => {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(businessData),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error ?? 'Failed to create business');
      }
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    },
  });
}

/**
 * Hook para actualizar un negocio
 * Mutation con invalidación automática de caché
 */
export function useUpdateBusiness(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (businessData: {
      name?: string;
      description?: string;
      categoryId?: string;
      cityId?: string;
      address?: string;
      email?: string;
      phone?: string;
      website?: string;
      facebookUrl?: string;
      instagramUrl?: string;
      twitterUrl?: string;
      linkedinUrl?: string;
      youtubeUrl?: string;
      tiktokUrl?: string;
      logoUrl?: string;
      coverUrl?: string;
      adImageUrl?: string;
    }) => {
      const response = await fetch(`/api/businesses/${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(businessData),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error ?? 'Failed to update business');
      }
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.detail(businessId) });
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    },
  });
}
