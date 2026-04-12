/**
 * Servicio Mock para el Directorio de Ciudades
 *
 * Simula las llamadas al backend para negocios y servicios profesionales.
 * Cuando el backend esté listo, solo se necesita reemplazar las
 * implementaciones mock por llamadas reales al API.
 */

import {
  BUSINESS_CATEGORIES,
  MOCK_BUSINESSES,
  MOCK_PROFESSIONAL_SERVICES,
  SERVICE_CATEGORIES,
} from '../data/mock-directory'
import {
  BusinessBasic,
  BusinessesResponse,
  DirectoryFilters,
  ProfessionalServiceBasic,
  ProfessionalServicesResponse,
} from '../interfaces/directory.interfaces'

/**
 * Simula delay de red para hacer el mock más realista
 */
const simulateNetworkDelay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Servicio de directorio (Mock)
 */
class DirectoryServiceMock {
  // ===========================================================================
  // NEGOCIOS
  // ===========================================================================

  /**
   * Obtiene todos los negocios de una ciudad con filtros opcionales
   */
  async getBusinessesByCity(cityId: string, filters?: DirectoryFilters): Promise<BusinessesResponse> {
    await simulateNetworkDelay()

    let businesses = [...MOCK_BUSINESSES]

    // Filtrar por búsqueda
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      businesses = businesses.filter(
        (b) =>
          b.name.toLowerCase().includes(searchLower) ||
          b.description?.toLowerCase().includes(searchLower) ||
          b.category.name.toLowerCase().includes(searchLower)
      )
    }

    // Filtrar por categoría
    if (filters?.categoryId) {
      businesses = businesses.filter((b) => b.category.id === filters.categoryId)
    }

    // Filtrar por letra inicial (del nombre de la categoría)
    if (filters?.letter) {
      businesses = businesses.filter((b) => b.category.name.toUpperCase().startsWith(filters.letter!.toUpperCase()))
    }

    // Paginación
    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const startIndex = (page - 1) * limit
    const paginatedBusinesses = businesses.slice(startIndex, startIndex + limit)

    return {
      businesses: paginatedBusinesses,
      total: businesses.length,
    }
  }

  /**
   * Busca negocios por texto
   */
  async searchBusinesses(cityId: string, query: string, letter?: string): Promise<BusinessBasic[]> {
    await simulateNetworkDelay(200)

    let businesses = [...MOCK_BUSINESSES]

    // Filtrar por búsqueda
    if (query) {
      const searchLower = query.toLowerCase()
      businesses = businesses.filter(
        (b) => b.name.toLowerCase().includes(searchLower) || b.description?.toLowerCase().includes(searchLower)
      )
    }

    // Filtrar por letra
    if (letter) {
      businesses = businesses.filter((b) => b.category.name.toUpperCase().startsWith(letter.toUpperCase()))
    }

    return businesses
  }

  /**
   * Obtiene un negocio por su ID
   */
  async getBusinessById(businessId: string): Promise<BusinessBasic | null> {
    await simulateNetworkDelay()

    const business = MOCK_BUSINESSES.find((b) => b.id === businessId)
    return business || null
  }

  /**
   * Obtiene las categorías de negocios
   */
  async getBusinessCategories() {
    await simulateNetworkDelay(100)
    return BUSINESS_CATEGORIES
  }

  // ===========================================================================
  // SERVICIOS PROFESIONALES
  // ===========================================================================

  /**
   * Obtiene todos los servicios profesionales de una ciudad con filtros opcionales
   */
  async getServicesByCity(cityId: string, filters?: DirectoryFilters): Promise<ProfessionalServicesResponse> {
    await simulateNetworkDelay()

    let services = [...MOCK_PROFESSIONAL_SERVICES]

    // Filtrar por búsqueda
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      services = services.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.description?.toLowerCase().includes(searchLower) ||
          s.category.name.toLowerCase().includes(searchLower)
      )
    }

    // Filtrar por categoría
    if (filters?.categoryId) {
      services = services.filter((s) => s.category.id === filters.categoryId)
    }

    // Filtrar por letra inicial (del nombre de la categoría)
    if (filters?.letter) {
      services = services.filter((s) => s.category.name.toUpperCase().startsWith(filters.letter!.toUpperCase()))
    }

    // Paginación
    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const startIndex = (page - 1) * limit
    const paginatedServices = services.slice(startIndex, startIndex + limit)

    return {
      services: paginatedServices,
      total: services.length,
    }
  }

  /**
   * Busca servicios profesionales por texto
   */
  async searchServices(cityId: string, query: string, letter?: string): Promise<ProfessionalServiceBasic[]> {
    await simulateNetworkDelay(200)

    let services = [...MOCK_PROFESSIONAL_SERVICES]

    // Filtrar por búsqueda
    if (query) {
      const searchLower = query.toLowerCase()
      services = services.filter(
        (s) => s.name.toLowerCase().includes(searchLower) || s.description?.toLowerCase().includes(searchLower)
      )
    }

    // Filtrar por letra
    if (letter) {
      services = services.filter((s) => s.category.name.toUpperCase().startsWith(letter.toUpperCase()))
    }

    return services
  }

  /**
   * Obtiene un servicio profesional por su ID
   */
  async getServiceById(serviceId: string): Promise<ProfessionalServiceBasic | null> {
    await simulateNetworkDelay()

    const service = MOCK_PROFESSIONAL_SERVICES.find((s) => s.id === serviceId)
    return service || null
  }

  /**
   * Obtiene las categorías de servicios profesionales
   */
  async getServiceCategories() {
    await simulateNetworkDelay(100)
    return SERVICE_CATEGORIES
  }
}

/**
 * Instancia singleton del servicio de directorio
 */
export const directoryService = new DirectoryServiceMock()
