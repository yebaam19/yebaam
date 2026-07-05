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
} from '../interfaces/professional-service.interfaces'
import type {
  CreateServiceActionInput,
  ServiceActionResult,
  UpdateServicePatchInput,
} from '../actions/service-action.helpers'
import {
  createServiceAction,
  deleteServiceAction,
  getServiceByIdAction,
  getServiceBySlugAction,
  listServicesAction,
  searchServicesAction,
  updateServiceAction,
} from '../actions/services.actions'

/**
 * Las actions de escritura devuelven `{ ok, ... }` (nunca lanzan a través de la
 * frontera server/cliente — Next.js redacta esos mensajes en producción). Aquí,
 * ya en el cliente, re-lanzamos el mensaje dentro de la mutationFn para que
 * `useAsyncAction` y la UI de errores existente lo muestren sin cambios.
 */
async function unwrap<T>(pending: Promise<ServiceActionResult<T>>): Promise<T> {
  const result = await pending
  if (!result.ok) throw new Error(result.error)
  return result.data
}

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

  create(
    data: CreateProfessionalServiceDTO | CreateServiceActionInput,
  ): Promise<ProfessionalServiceDetailResponse> {
    return unwrap(createServiceAction(data))
  }

  update(id: string, data: UpdateServicePatchInput): Promise<ProfessionalServiceDetailResponse> {
    return unwrap(updateServiceAction(id, data))
  }

  async delete(id: string): Promise<void> {
    await unwrap(deleteServiceAction(id))
  }
}

export const servicesApiClient = new ServicesApiClient()
