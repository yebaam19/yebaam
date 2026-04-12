/**
 * Services API Client
 *
 * Cliente para operaciones CRUD de servicios profesionales
 * 
 * NOTA: Actualmente usa datos mock hasta que el backend esté implementado
 */

import { getAxiosInstance } from '@/lib/axios/axiosInstance'
import type {
  ProfessionalServiceDetailResponse,
  ProfessionalServicesListResponse,
  ProfessionalServiceFilters,
  ProfessionalServiceBasic,
} from '../interfaces/professional-service.interfaces'

// MOCK IMPORTS - Temporal hasta implementar backend
import {
  getMockServiceById,
  getMockServiceBySlug,
  MOCK_PROFESSIONAL_SERVICES_BASIC,
  MOCK_CITIES,
} from '../data/mock-professional-services'

const simulateDelay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms))

class ServicesApiClient {
  private readonly axios = getAxiosInstance()
  private readonly baseUrl = '/api/professional-services'
  private readonly USE_MOCK = false 

  /**
   * Obtiene un servicio por ID
   */
  async getById(id: string): Promise<ProfessionalServiceDetailResponse | null> {
    if (this.USE_MOCK) {
      await simulateDelay()
      const service = getMockServiceById(id)
      return service ? { service } : null
    }

    try {
      const response = await this.axios.get<ProfessionalServiceDetailResponse>(
        `${this.baseUrl}/${id}`
      )
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Obtiene un servicio por slug
   */
  async getBySlug(slug: string): Promise<ProfessionalServiceDetailResponse | null> {
    if (this.USE_MOCK) {
      await simulateDelay()
      const service = getMockServiceBySlug(slug)
      return service ? { service } : null
    }

    try {
      const response = await this.axios.get<ProfessionalServiceDetailResponse>(
        `${this.baseUrl}/slug/${slug}`
      )
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Lista servicios con filtros y paginación
   */
  async list(filters: ProfessionalServiceFilters = {}): Promise<ProfessionalServicesListResponse> {
    if (this.USE_MOCK) {
      await simulateDelay()

      const { search, categoryId, cityId, stateId, minRating, availableForHire, page = 1, limit = 10 } = filters

      let services = [...MOCK_PROFESSIONAL_SERVICES_BASIC]

      // Filtro por búsqueda
      if (search) {
        const searchLower = search.toLowerCase()
        services = services.filter(
          (service) =>
            service.name.toLowerCase().includes(searchLower) ||
            service.description?.toLowerCase().includes(searchLower) ||
            service.category?.name.toLowerCase().includes(searchLower) ||
            service.address?.toLowerCase().includes(searchLower)
        )
      }

      // Filtro por categoría
      if (categoryId) {
        services = services.filter((service) => service.category?.id === categoryId)
      }

      // Filtro por estado/departamento
      if (stateId) {
        const citiesInState = MOCK_CITIES.filter((city) => city.stateId === stateId)
        const cityIds = citiesInState.map((city) => city.id)
        services = services.filter((service) => cityIds.includes(service.city?.id ?? ''))
      }

      // Filtro por ciudad
      if (cityId) {
        services = services.filter((service) => service.city?.id === cityId)
      }

      // Filtro por rating mínimo
      if (minRating !== undefined) {
        services = services.filter((service) => (service.averageRating ?? 0) >= minRating)
      }

      // Filtro por disponibilidad
      if (availableForHire !== undefined) {
        services = services.filter((service) => service.availableForHire === availableForHire)
      }

      // Total antes de paginar
      const total = services.length
      const totalPages = Math.ceil(total / limit)

      // Paginación
      const startIndex = (page - 1) * limit
      services = services.slice(startIndex, startIndex + limit)

      return {
        services,
        total,
        page,
        limit,
        totalPages,
      }
    }

    const response = await this.axios.get<ProfessionalServicesListResponse>(this.baseUrl, {
      params: filters,
    })
    return response.data
  }

  /**
   * Busca servicios por query
   */
  async search(query: string, limit: number = 10): Promise<ProfessionalServiceBasic[]> {
    if (this.USE_MOCK) {
      await simulateDelay(200)

      const searchLower = query.toLowerCase()

      return MOCK_PROFESSIONAL_SERVICES_BASIC.filter(
        (service) =>
          service.name.toLowerCase().includes(searchLower) ||
          service.description?.toLowerCase().includes(searchLower) ||
          service.category?.name.toLowerCase().includes(searchLower)
      ).slice(0, limit)
    }

    const response = await this.axios.get<ProfessionalServiceBasic[]>(`${this.baseUrl}/search`, {
      params: { q: query, limit },
    })
    return response.data
  }

  /**
   * Crea un nuevo servicio profesional
   */
  async create(data: CreateServiceData): Promise<ProfessionalServiceDetailResponse> {
    const response = await this.axios.post<ProfessionalServiceDetailResponse>(
      this.baseUrl,
      data
    )
    return response.data
  }

  /**
   * Actualiza un servicio existente
   */
  async update(id: string, data: UpdateServiceData): Promise<ProfessionalServiceDetailResponse> {
    const response = await this.axios.put<ProfessionalServiceDetailResponse>(
      `${this.baseUrl}/${id}`,
      data
    )
    return response.data
  }

  /**
   * Elimina un servicio
   */
  async delete(id: string): Promise<void> {
    await this.axios.delete(`${this.baseUrl}/${id}`)
  }
}

// Types para CREATE y UPDATE
export interface CreateServiceData {
  name: string
  slug: string
  description: string
  longDescription?: string
  professionalProfileId: string
  categoryId: string
  coverImage?: string
  images?: string[]
  price?: number
  priceType?: 'fixed' | 'hourly' | 'negotiable'
  currency?: string
  availableForHire?: boolean
  address?: string
  cityId?: string
  stateId?: string
  tags?: string[]
}

export interface UpdateServiceData {
  name?: string
  slug?: string
  description?: string
  longDescription?: string
  coverImage?: string
  images?: string[]
  price?: number
  priceType?: 'fixed' | 'hourly' | 'negotiable'
  currency?: string
  availableForHire?: boolean
  address?: string
  cityId?: string
  stateId?: string
  tags?: string[]
  isActive?: boolean
  isFeatured?: boolean
}

export const servicesApiClient = new ServicesApiClient()
