/**
 * Categories API Client
 *
 * Cliente para operaciones con categorías de servicios
 * 
 * NOTA: Actualmente usa datos mock hasta que el backend esté implementado
 */

import { getAxiosInstance } from '@/lib/axios/axiosInstance'
import type { ProfessionalServiceCategory } from '../interfaces/professional-service.interfaces'

// MOCK IMPORTS - Temporal hasta implementar backend
import { SERVICE_CATEGORIES } from '../data/mock-professional-services'

const simulateDelay = (ms: number = 100) => new Promise((resolve) => setTimeout(resolve, ms))

class CategoriesApiClient {
  private readonly axios = getAxiosInstance()
  private readonly baseUrl = '/api/professional-services/categories'
  private readonly USE_MOCK = false //  Cambiado a false - backend está listo

  /**
   * Obtiene todas las categorías
   */
  async getAll(): Promise<ProfessionalServiceCategory[]> {
    if (this.USE_MOCK) {
      await simulateDelay()
      return SERVICE_CATEGORIES
    }

    const response = await this.axios.get<{ categories: ProfessionalServiceCategory[] }>(this.baseUrl)
    return response.data.categories
  }

  /**
   * Obtiene una categoría por ID
   */
  async getById(id: string): Promise<ProfessionalServiceCategory | null> {
    if (this.USE_MOCK) {
      await simulateDelay()
      return SERVICE_CATEGORIES.find((cat) => cat.id === id) ?? null
    }

    try {
      const response = await this.axios.get<ProfessionalServiceCategory>(
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
}

export const categoriesApiClient = new CategoriesApiClient()
