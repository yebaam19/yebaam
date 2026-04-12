/**
 * Stats API Client
 *
 * Cliente para operaciones de estadísticas y servicios destacados
 * 
 * NOTA: Actualmente usa datos mock hasta que el backend esté implementado
 */

import { getAxiosInstance } from '@/lib/axios/axiosInstance'
import type { ProfessionalServiceBasic } from '../interfaces/professional-service.interfaces'

// MOCK IMPORTS - Temporal hasta implementar backend
import {
  getMockServiceById,
  MOCK_PROFESSIONAL_SERVICES_BASIC,
} from '../data/mock-professional-services'

const simulateDelay = (ms: number = 100) => new Promise((resolve) => setTimeout(resolve, ms))

interface ServiceStatsResponse {
  totalReviews: number
  averageRating: number
  totalMedia: number
}

class StatsApiClient {
  private readonly axios = getAxiosInstance()
  private readonly baseUrl = '/api/professional-services'
  private readonly USE_MOCK = false //  Cambiado a false - backend está listo

  /**
   * Obtiene estadísticas de un servicio
   */
  async getServiceStats(serviceId: string): Promise<ServiceStatsResponse> {
    if (this.USE_MOCK) {
      await simulateDelay()
      
      const service = getMockServiceById(serviceId)
      
      if (!service) {
        return {
          totalReviews: 0,
          averageRating: 0,
          totalMedia: 0,
        }
      }

      return {
        totalReviews: service._count.reviews,
        averageRating: service.averageRating ?? 0,
        totalMedia: service._count.media,
      }
    }

    const response = await this.axios.get<ServiceStatsResponse>(
      `${this.baseUrl}/${serviceId}/stats`
    )
    return response.data
  }

  /**
   * Obtiene servicios destacados
   */
  async getFeaturedServices(limit: number = 6): Promise<ProfessionalServiceBasic[]> {
    if (this.USE_MOCK) {
      await simulateDelay()

      return [...MOCK_PROFESSIONAL_SERVICES_BASIC]
        .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
        .slice(0, limit)
    }

    const response = await this.axios.get<ProfessionalServiceBasic[]>(
      `${this.baseUrl}/featured`,
      { params: { limit } }
    )
    return response.data
  }

  /**
   * Obtiene servicios más recientes
   */
  async getRecentServices(limit: number = 10): Promise<ProfessionalServiceBasic[]> {
    if (this.USE_MOCK) {
      await simulateDelay()

      // En el mock, simplemente retornamos los primeros
      return MOCK_PROFESSIONAL_SERVICES_BASIC.slice(0, limit)
    }

    const response = await this.axios.get<ProfessionalServiceBasic[]>(
      `${this.baseUrl}/recent`,
      { params: { limit } }
    )
    return response.data
  }
}

export const statsApiClient = new StatsApiClient()
