'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { invalidate } from '@/lib/hooks/cacheStore';
import { servicesApiClient } from '../api';
import type {
  CreateProfessionalServiceDTO,
  ProfessionalServiceFilters,
  UpdateProfessionalServiceDTO,
} from '../interfaces/professional-service.interfaces';

export const servicesKeys = {
  all: ['professional-services'] as const,
  lists: () => [...servicesKeys.all, 'list'] as const,
  list: (filters: ProfessionalServiceFilters) =>
    [...servicesKeys.lists(), JSON.stringify(filters)] as const,
  details: () => [...servicesKeys.all, 'detail'] as const,
  detail: (id: string) => [...servicesKeys.details(), id] as const,
  bySlug: (slug: string) => [...servicesKeys.details(), 'slug', slug] as const,
  search: (query: string) => [...servicesKeys.all, 'search', query] as const,
};

export function useService(id: string | undefined) {
  return useFetch(
    servicesKeys.detail(id!),
    () => servicesApiClient.getById(id!),
    { enabled: !!id, staleTime: 1000 * 60 * 5 }
  );
}

export function useServiceBySlug(slug: string | undefined) {
  return useFetch(
    servicesKeys.bySlug(slug!),
    () => servicesApiClient.getBySlug(slug!),
    { enabled: !!slug, staleTime: 1000 * 60 * 5 }
  );
}

export function useServices(filters: ProfessionalServiceFilters = {}) {
  return useFetch(
    servicesKeys.list(filters),
    () => servicesApiClient.list(filters),
    { staleTime: 1000 * 60 * 2 }
  );
}

export function useSearchServices(query: string | undefined, limit: number = 10) {
  return useFetch(
    servicesKeys.search(query || ''),
    () => servicesApiClient.search(query!, limit),
    { enabled: !!query && query.length >= 2, staleTime: 1000 * 60 }
  );
}

export function useCreateService() {
  return useAsyncAction(
    (data: CreateProfessionalServiceDTO) => servicesApiClient.create(data),
    {
      onSuccess: () => {
        invalidate('professional-services::list');
      },
    }
  );
}

export function useUpdateService() {
  return useAsyncAction(
    ({ id, data }: { id: string; data: UpdateProfessionalServiceDTO }) =>
      servicesApiClient.update(id, data),
    {
      onSuccess: (_, { id }) => {
        invalidate(`professional-services::detail::${id}`);
        invalidate('professional-services::detail');
        invalidate('professional-services::list');
      },
    }
  );
}

export function useDeleteService() {
  return useAsyncAction(
    (id: string) => servicesApiClient.delete(id),
    {
      onSuccess: (_, id) => {
        invalidate(`professional-services::detail::${id}`);
        invalidate('professional-services::list');
      },
    }
  );
}
