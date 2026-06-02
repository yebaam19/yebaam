/**
 * Services API Client
 *
 * Thin isomorphic facade over the professional-services Server Actions. Keeps
 * the class/singleton shape the hooks + service facade already consume, while
 * the real work (Supabase reads/writes via RLS) lives in
 * `../actions/services.actions` + `../server/services.server`. No axios.
 */

import type {
  CreateProfessionalServiceDTO,
  ProfessionalServiceBasic,
  ProfessionalServiceDetailResponse,
  ProfessionalServiceFilters,
  ProfessionalServicesListResponse,
  UpdateProfessionalServiceDTO,
} from '../interfaces/professional-service.interfaces'
import {
  createServiceAction,
  deleteServiceAction,
  getServiceByIdAction,
  getServiceBySlugAction,
  listServicesAction,
  searchServicesAction,
  updateServiceAction,
} from '../actions/services.actions'

class ServicesApiClient {
  getById(id: string): Promise<ProfessionalServiceDetailResponse | null> {
    return getServiceByIdAction(id)
  }

  getBySlug(slug: string): Promise<ProfessionalServiceDetailResponse | null> {
    return getServiceBySlugAction(slug)
  }

  list(filters: ProfessionalServiceFilters = {}): Promise<ProfessionalServicesListResponse> {
    return listServicesAction(filters)
  }

  search(query: string, limit: number = 10): Promise<ProfessionalServiceBasic[]> {
    return searchServicesAction(query, limit)
  }

  create(data: CreateProfessionalServiceDTO): Promise<ProfessionalServiceDetailResponse> {
    return createServiceAction(data)
  }

  update(id: string, data: UpdateProfessionalServiceDTO): Promise<ProfessionalServiceDetailResponse> {
    return updateServiceAction(id, data)
  }

  async delete(id: string): Promise<void> {
    await deleteServiceAction(id)
  }
}

export const servicesApiClient = new ServicesApiClient()
