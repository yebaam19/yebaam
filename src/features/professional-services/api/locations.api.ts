/**
 * Locations API Client
 *
 * Cliente para operaciones con estados y ciudades
 * 
 * NOTA: Actualmente usa datos mock hasta que el backend esté implementado
 */

import { getAxiosInstance } from '@/lib/http/legacy-client'
import type {
  State,
  City,
  LocationFiltersData,
} from '../interfaces/professional-service.interfaces'

// MOCK IMPORTS - Temporal hasta implementar backend
import {
  getAllStates,
  getCitiesByState as getMockCitiesByState,
  MOCK_CITIES,
  MOCK_STATES,
} from '../data/mock-professional-services'

const simulateDelay = (ms: number = 100) => new Promise((resolve) => setTimeout(resolve, ms))

class LocationsApiClient {
  private readonly axios = getAxiosInstance()
  private readonly baseUrl = '/api/professional-services/locations'
  private readonly USE_MOCK = true // Mock backend en dev; backend Supabase pendiente

  /**
   * Obtiene todos los estados
   */  /**
   * Obtiene todos los estados
   */
  async getStates(): Promise<State[]> {
    if (this.USE_MOCK) {
      await simulateDelay()
      return getAllStates()
    }

    const response = await this.axios.get<{ states: State[] }>(`${this.baseUrl}/states`)
    return response.data.states
  }

  /**
   * Obtiene las ciudades de un estado
   */
  async getCitiesByState(stateId: string): Promise<City[]> {
    if (this.USE_MOCK) {
      await simulateDelay()
      return getMockCitiesByState(stateId)
    }

    const response = await this.axios.get<{ cities: City[] }>(`${this.baseUrl}/states/${stateId}/cities`)
    return response.data.cities
  }

  /**
   * Obtiene todas las ciudades
   */
  async getAllCities(): Promise<City[]> {
    if (this.USE_MOCK) {
      await simulateDelay()
      return MOCK_CITIES
    }

    const response = await this.axios.get<{ cities: City[] }>(`${this.baseUrl}/cities`)
    return response.data.cities
  }

  /**
   * Obtiene datos de filtros de ubicación (estados con sus ciudades)
   */
  async getLocationFiltersData(): Promise<LocationFiltersData> {
    if (this.USE_MOCK) {
      await simulateDelay()
      return {
        states: MOCK_STATES,
        cities: MOCK_CITIES,
      }
    }

    const response = await this.axios.get<LocationFiltersData>(
      `${this.baseUrl}/filters`
    )
    return response.data
  }
}

export const locationsApiClient = new LocationsApiClient()
