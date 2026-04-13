'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { invalidate } from '@/lib/hooks/cacheStore';
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
 * Query Keys (centralizadas para mejor mantenimiento)
 */
export const businessKeys = {
  all: ['businesses'] as const,
  lists: () => [...businessKeys.all, 'list'] as const,
  list: (filters: BusinessFilters) => [...businessKeys.lists(), JSON.stringify(filters)] as const,
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

export function useBusinesses(filters: BusinessFilters = {}) {
  return useFetch<BusinessesListResponse>(
    businessKeys.list(filters),
    () => businessService.getBusinesses(filters),
    { staleTime: 1000 * 60 * 5 }
  );
}

export function useBusinessById(id: string) {
  return useFetch<BusinessDetailResponse | null>(
    businessKeys.detail(id),
    () => businessService.getBusinessById(id),
    { staleTime: 1000 * 60 * 5, enabled: !!id }
  );
}

export function useBusinessBySlug(slug: string) {
  return useFetch<BusinessDetailResponse | null>(
    businessKeys.detailBySlug(slug),
    () => businessService.getBusinessBySlug(slug),
    { staleTime: 1000 * 60 * 5, enabled: !!slug }
  );
}

export function useBusinessesByCity(cityId: string, filters: Omit<BusinessFilters, 'cityId'> = {}) {
  return useFetch<BusinessesListResponse>(
    businessKeys.list({ ...filters, cityId }),
    () => businessService.getBusinessesByCity(cityId, filters),
    { staleTime: 1000 * 60 * 5, enabled: !!cityId }
  );
}

export function useBusinessesByCategory(categoryId: string, filters: Omit<BusinessFilters, 'categoryId'> = {}) {
  return useFetch<BusinessesListResponse>(
    businessKeys.list({ ...filters, categoryId }),
    () => businessService.getBusinessesByCategory(categoryId, filters),
    { staleTime: 1000 * 60 * 5, enabled: !!categoryId }
  );
}

export function useBusinessCategories() {
  return useFetch<BusinessCategory[]>(
    businessKeys.categories(),
    () => businessService.getCategories(),
    { staleTime: 1000 * 60 * 30 }
  );
}

export function useBusinessCategory(id: string) {
  return useFetch<BusinessCategory | null>(
    businessKeys.category(id),
    () => businessService.getCategoryById(id),
    { staleTime: 1000 * 60 * 30, enabled: !!id }
  );
}

export function useLocationFilters() {
  return useFetch<LocationFiltersData>(
    businessKeys.locations(),
    () => businessService.getLocationFilters(),
    { staleTime: 1000 * 60 * 30 }
  );
}

export function useStates() {
  return useFetch<State[]>(
    businessKeys.states(),
    () => businessService.getStates(),
    { staleTime: 1000 * 60 * 30 }
  );
}

export function useCitiesByState(stateId?: string) {
  return useFetch<City[]>(
    businessKeys.cities(stateId),
    () => businessService.getCitiesByState(stateId!),
    { staleTime: 1000 * 60 * 30, enabled: !!stateId }
  );
}

export function useQuickSearch(query: string, limit: number = 5) {
  return useFetch<BusinessBasic[]>(
    businessKeys.quickSearch(query),
    () => businessService.quickSearch(query, limit),
    { staleTime: 1000 * 60, enabled: query.length >= 2 }
  );
}

export function useCreateReview(businessId: string) {
  return useAsyncAction(
    (review: { rating: number; title?: string; comment?: string }) =>
      businessService.createReview(businessId, review),
    {
      onSuccess: () => {
        invalidate(`businesses::detail::${businessId}`);
        invalidate('businesses::list');
      },
    }
  );
}

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

export function useCreateBusiness() {
  return useAsyncAction(
    async (businessData: {
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
    {
      onSuccess: () => {
        invalidate('businesses::list');
      },
    }
  );
}

export function useUpdateBusiness(businessId: string) {
  return useAsyncAction(
    async (businessData: {
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
    {
      onSuccess: () => {
        invalidate(`businesses::detail::${businessId}`);
        invalidate('businesses::list');
      },
    }
  );
}
