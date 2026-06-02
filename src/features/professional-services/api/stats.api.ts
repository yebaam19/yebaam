/**
 * Stats API Client — thin facade over the Server Actions.
 */

import type { ProfessionalServiceBasic } from '../interfaces/professional-service.interfaces'
import {
  featuredServicesAction,
  recentServicesAction,
  serviceStatsAction,
} from '../actions/services.actions'

interface ServiceStatsResponse {
  totalReviews: number
  averageRating: number
  totalMedia: number
}

class StatsApiClient {
  getServiceStats(serviceId: string): Promise<ServiceStatsResponse> {
    return serviceStatsAction(serviceId)
  }

  getFeaturedServices(limit: number = 6): Promise<ProfessionalServiceBasic[]> {
    return featuredServicesAction(limit)
  }

  getRecentServices(limit: number = 10): Promise<ProfessionalServiceBasic[]> {
    return recentServicesAction(limit)
  }
}

export const statsApiClient = new StatsApiClient()
