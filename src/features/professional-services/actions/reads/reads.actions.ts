'use server'

import {
  City,
  LocationFiltersData,
  ProfessionalServiceBasic,
  ProfessionalServiceDetailResponse,
  ProfessionalServiceFilters,
  ProfessionalServicesListResponse,
  State,
} from '../../interfaces/professional-service.interfaces'
import {
  getAllCities,
  getCitiesByState,
  getFeaturedServices,
  getMyServiceEligibility,
  getRecentServices,
  getServiceById,
  getServiceBySlug,
  getServiceStats,
  getServicesByUserId,
  getStates,
  listServices,
  searchServices,
  type ServiceEligibility,
} from '../../server/services.server'
import { getServerClient } from '@/utils/supabase/server'

export async function listServicesAction(
  filters: ProfessionalServiceFilters = {},
): Promise<ProfessionalServicesListResponse> {
  return listServices(filters)
}

export async function getServiceByIdAction(id: string): Promise<ProfessionalServiceDetailResponse | null> {
  return getServiceById(id)
}

export async function getServiceBySlugAction(slug: string): Promise<ProfessionalServiceDetailResponse | null> {
  return getServiceBySlug(slug)
}

export async function searchServicesAction(query: string, limit = 10): Promise<ProfessionalServiceBasic[]> {
  return searchServices(query, limit)
}

export async function featuredServicesAction(limit = 6): Promise<ProfessionalServiceBasic[]> {
  return getFeaturedServices(limit)
}

export async function recentServicesAction(limit = 10): Promise<ProfessionalServiceBasic[]> {
  return getRecentServices(limit)
}

export async function serviceStatsAction(
  serviceId: string,
): Promise<{ totalReviews: number; averageRating: number; totalMedia: number }> {
  return getServiceStats(serviceId)
}

export async function servicesByUserIdAction(userId: string): Promise<ProfessionalServiceBasic[]> {
  // Owners see all of their own services (incl. non-public); everyone else sees
  // only PUBLIC+ACTIVE (RLS enforces this too).
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  return getServicesByUserId(userId, data.user?.id === userId)
}

export async function statesAction(): Promise<State[]> {
  return getStates()
}

export async function allCitiesAction(): Promise<City[]> {
  return getAllCities()
}

export async function citiesByStateAction(stateId: string): Promise<City[]> {
  return getCitiesByState(stateId)
}

export async function locationFiltersAction(): Promise<LocationFiltersData> {
  const [states, cities] = await Promise.all([getStates(), getAllCities()])
  return { states, cities }
}

export async function myEligibilityAction(): Promise<ServiceEligibility> {
  return getMyServiceEligibility()
}
