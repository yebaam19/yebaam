'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { statsApiClient } from '../api';

export const statsKeys = {
  all: ['professional-service-stats'] as const,
  serviceStats: (serviceId: string) => [...statsKeys.all, 'service', serviceId] as const,
  featured: (limit: number) => [...statsKeys.all, 'featured', limit] as const,
  recent: (limit: number) => [...statsKeys.all, 'recent', limit] as const,
};

export function useServiceStats(serviceId: string | undefined) {
  return useFetch(
    statsKeys.serviceStats(serviceId!),
    () => statsApiClient.getServiceStats(serviceId!),
    { enabled: !!serviceId, staleTime: 1000 * 60 * 5 }
  );
}

export function useFeaturedServices(limit: number = 6) {
  return useFetch(
    statsKeys.featured(limit),
    () => statsApiClient.getFeaturedServices(limit),
    { staleTime: 1000 * 60 * 10 }
  );
}

export function useRecentServices(limit: number = 10) {
  return useFetch(
    statsKeys.recent(limit),
    () => statsApiClient.getRecentServices(limit),
    { staleTime: 1000 * 60 * 5 }
  );
}
