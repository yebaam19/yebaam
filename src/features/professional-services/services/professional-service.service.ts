
import {
  City,
  LocationFiltersData,
  ProfessionalServiceBasic,
  ProfessionalServiceCategory,
  ProfessionalServiceDetailResponse,
  ProfessionalServiceFilters,
  ProfessionalServicesListResponse,
  State,
} from '../interfaces/professional-service.interfaces'

// Importar los API clients reales
import { servicesApiClient } from '../api/services.api'
import { categoriesApiClient } from '../api/categories.api'
import { locationsApiClient } from '../api/locations.api'
import { statsApiClient } from '../api/stats.api'


class ProfessionalServiceService {
  async getServiceById(id: string): Promise<ProfessionalServiceDetailResponse | null> {
    return servicesApiClient.getById(id)
  }

  async getServiceBySlug(slug: string): Promise<ProfessionalServiceDetailResponse | null> {
    return servicesApiClient.getBySlug(slug)
  }

  /**
   * Lista servicios profesionales con filtros y paginación
   */
  async getServices(filters: ProfessionalServiceFilters = {}): Promise<ProfessionalServicesListResponse> {
    return servicesApiClient.list(filters)
  }

  /**
   * Obtiene servicios por ciudad
   */
  async getServicesByCity(
    cityId: string,
    filters: Omit<ProfessionalServiceFilters, 'cityId'> = {}
  ): Promise<ProfessionalServicesListResponse> {
    return this.getServices({ ...filters, cityId })
  }

  /**
   * Obtiene servicios por categoría
   */
  async getServicesByCategory(
    categoryId: string,
    filters: Omit<ProfessionalServiceFilters, 'categoryId'> = {}
  ): Promise<ProfessionalServicesListResponse> {
    return this.getServices({ ...filters, categoryId })
  }

  /**
   * Busca servicios
   */
  async searchServices(query: string, limit: number = 10): Promise<ProfessionalServiceBasic[]> {
    return servicesApiClient.search(query, limit)
  }

  // ===========================================================================
  // CATEGORÍAS
  // ===========================================================================

  /**
   * Obtiene todas las categorías de servicios
   */
  async getCategories(): Promise<ProfessionalServiceCategory[]> {
    return categoriesApiClient.getAll()
  }

  /**
   * Obtiene una categoría por ID
   */
  async getCategoryById(id: string): Promise<ProfessionalServiceCategory | null> {
    return categoriesApiClient.getById(id)
  }

  // ===========================================================================
  // ESTADÍSTICAS
  // ===========================================================================

  /**
   * Obtiene estadísticas de un servicio
   */
  async getServiceStats(serviceId: string): Promise<{
    totalReviews: number
    averageRating: number
    totalMedia: number
  } | null> {
    try {
      return await statsApiClient.getServiceStats(serviceId)
    } catch (error) {
      return null
    }
  }

  // ===========================================================================
  // SERVICIOS DESTACADOS
  // ===========================================================================

  /**
   * Obtiene servicios destacados (mejor rating)
   */
  async getFeaturedServices(limit: number = 5): Promise<ProfessionalServiceBasic[]> {
    return statsApiClient.getFeaturedServices(limit)
  }

  /**
   * Obtiene servicios recientes
   */
  async getRecentServices(limit: number = 5): Promise<ProfessionalServiceBasic[]> {
    return statsApiClient.getRecentServices(limit)
  }

  // ===========================================================================
  // UBICACIONES (Estados/Ciudades)
  // ===========================================================================

  /**
   * Obtiene todos los estados/departamentos
   */
  async getStates(): Promise<State[]> {
    return locationsApiClient.getStates()
  }

  /**
   * Obtiene ciudades por estado
   */
  async getCitiesByState(stateId: string): Promise<City[]> {
    return locationsApiClient.getCitiesByState(stateId)
  }

  /**
   * Obtiene todas las ciudades
   */
  async getAllCities(): Promise<City[]> {
    return locationsApiClient.getAllCities()
  }

  /**
   * Obtiene datos para filtros de ubicación
   */
  async getLocationFiltersData(): Promise<LocationFiltersData> {
    return locationsApiClient.getLocationFiltersData()
  }

  /**
   * Obtiene servicios por estado/departamento
   */
  async getServicesByState(
    stateId: string,
    filters: Omit<ProfessionalServiceFilters, 'stateId'> = {}
  ): Promise<ProfessionalServicesListResponse> {
    return this.getServices({ ...filters, stateId })
  }
}

// Singleton
export const professionalServiceService = new ProfessionalServiceService()
