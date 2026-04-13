'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { locationsApiClient } from '../api';

export const locationsKeys = {
  all: ['professional-service-locations'] as const,
  states: () => [...locationsKeys.all, 'states'] as const,
  cities: () => [...locationsKeys.all, 'cities'] as const,
  citiesByState: (stateId: string) => [...locationsKeys.cities(), 'state', stateId] as const,
  filters: () => [...locationsKeys.all, 'filters'] as const,
};

export function useStates() {
  return useFetch(locationsKeys.states(), () => locationsApiClient.getStates(), {
    staleTime: 1000 * 60 * 30,
  });
}

export function useCitiesByState(stateId: string | undefined) {
  return useFetch(
    locationsKeys.citiesByState(stateId!),
    () => locationsApiClient.getCitiesByState(stateId!),
    { enabled: !!stateId, staleTime: 1000 * 60 * 30 }
  );
}

export function useAllCities() {
  return useFetch(locationsKeys.cities(), () => locationsApiClient.getAllCities(), {
    staleTime: 1000 * 60 * 30,
  });
}

export function useLocationFilters() {
  return useFetch(locationsKeys.filters(), () => locationsApiClient.getLocationFiltersData(), {
    staleTime: 1000 * 60 * 30,
  });
}
