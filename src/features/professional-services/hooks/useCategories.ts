'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { categoriesApiClient } from '../api';

export const categoriesKeys = {
  all: ['professional-service-categories'] as const,
  lists: () => [...categoriesKeys.all, 'list'] as const,
  list: () => [...categoriesKeys.lists()] as const,
  details: () => [...categoriesKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoriesKeys.details(), id] as const,
};

export function useCategories() {
  return useFetch(
    categoriesKeys.list(),
    () => categoriesApiClient.getAll(),
    { staleTime: 1000 * 60 * 10 }
  );
}

export function useCategory(id: string | undefined) {
  return useFetch(
    categoriesKeys.detail(id!),
    () => categoriesApiClient.getById(id!),
    { enabled: !!id, staleTime: 1000 * 60 * 10 }
  );
}
