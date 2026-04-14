/**
 * Servicio Mock para Ciudades
 *
 * Simula las llamadas al backend mientras no existan los endpoints.
 * Cuando el backend esté listo, solo se necesita reemplazar las
 * implementaciones mock por llamadas reales al API.
 */

import { unslugify } from '@/lib/utils'
import { MOCK_CITIES, getOrCreateMockCity } from '../data/mock-cities'
import { CitiesResponse, City, CityMedia, GetCitiesFilters, MediaType } from '../interfaces/city.interfaces'
import { GlobalStats } from '../interfaces/global-stats.interface'

async function jsonFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'same-origin' })
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  return (await response.json()) as T
}

type CityBackendRow = {
  id: string
  name: string
  slug: string
  description?: string
  coverImageUrl?: string
  logoUrl?: string
  isFeatured?: boolean
  location: {
    country: string
    state?: string
  }
  stats: {
    followerCount: number
    photoCount: number
    videoCount: number
    postCount: number
  }
}

type CitiesListPayload = {
  cities?: CityBackendRow[]
  total?: number
}

/**
 * Simula delay de red para hacer el mock más realista
 */
const simulateNetworkDelay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Servicio de ciudades
 */
class CityServiceMock {
  /**
   * Obtiene todas las ciudades con filtros opcionales
   * Este método SÍ usa el API real
   */
  async getAllCities(filters?: GetCitiesFilters): Promise<CitiesResponse> {
    try {
      const params = new URLSearchParams()
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.page) {
        const offset = ((filters.page - 1) * (filters.limit || 12)).toString()
        params.append('offset', offset)
      } else {
        params.append('offset', '0')
      }

      const payload = await jsonFetch<CitiesListPayload>(`/api/cities?${params.toString()}`)
      const rawCities = payload?.cities
      if (!Array.isArray(rawCities)) {
        throw new Error('cities-endpoint-unavailable')
      }

      // Mapear respuesta del backend al formato del frontend
      const mappedCities = rawCities.map((city) => ({
        id: city.id,
        name: city.name,
        slug: city.slug,
        description: city.description ?? '',
        coverImageUrl: city.coverImageUrl ?? '',
        logoUrl: city.logoUrl ?? '',
        country: {
          id: city.location.country,
          name: city.location.country,
          code: 'CO',
        },
        state: city.location.state ? {
          id: city.location.state,
          name: city.location.state,
          countryId: city.location.country,
        } : undefined,
        stats: {
          followersCount: city.stats.followerCount,
          photosCount: city.stats.photoCount,
          videosCount: city.stats.videoCount,
          postsCount: city.stats.postCount,
        },
        isFollowing: false,
        isFeatured: city.isFeatured ?? false,
      }))

      return {
        cities: mappedCities,
        total: payload?.total ?? mappedCities.length,
      }
    } catch {
      // Cities backend is not yet migrated to Supabase — use mocks silently.
      // Fallback a datos mock si falla el API
      await simulateNetworkDelay()
      let cities = [...MOCK_CITIES]

      // Filtrar por búsqueda
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        cities = cities.filter(
          (city) =>
            city.name.toLowerCase().includes(searchLower) ||
            city.state?.name.toLowerCase().includes(searchLower) ||
            city.country.name.toLowerCase().includes(searchLower)
        )
      }

      // Filtrar por país
      if (filters?.countryId) {
        cities = cities.filter((city) => city.country.id === filters.countryId)
      }

      // Filtrar por estado
      if (filters?.stateId) {
        cities = cities.filter((city) => city.state?.id === filters.stateId)
      }

      // Paginación
      const page = filters?.page || 1
      const limit = filters?.limit || 12
      const startIndex = (page - 1) * limit
      const paginatedCities = cities.slice(startIndex, startIndex + limit)

      return {
        cities: paginatedCities,
        total: cities.length,
      }
    }
  }

  /**
   * Obtiene una ciudad por su slug
   * Este método SÍ usa el API real
   */
  async getCityBySlug(slug: string): Promise<City | null> {
    try {
      const city = await jsonFetch<CityBackendRow>(`/api/cities/${slug}`)
      if (!city || typeof city !== 'object' || !('id' in city) || !city.location || !city.stats) {
        throw new Error('city-endpoint-unavailable')
      }

      // Mapear respuesta del backend al formato del frontend
      return {
        id: city.id,
        name: city.name,
        slug: city.slug,
        description: city.description ?? '',
        stateId: city.location.state || undefined,
        countryId: city.location.country,
        coverImageUrl: city.coverImageUrl ?? '',
        logoUrl: city.logoUrl ?? '',
        country: {
          id: city.location.country,
          name: city.location.country,
          code: 'CO',
        },
        state: city.location.state ? {
          id: city.location.state,
          name: city.location.state,
          countryId: city.location.country,
        } : undefined,
        stats: {
          followersCount: city.stats.followerCount,
          photosCount: city.stats.photoCount,
          videosCount: city.stats.videoCount,
          postsCount: city.stats.postCount,
        },
        isFollowing: false,
        isFeatured: city.isFeatured ?? false,
        cityMedia: [], // TODO: Implementar cuando exista endpoint de media
      }
    } catch {
      // City backend is not yet migrated to Supabase — use mocks silently.
      // Fallback a datos mock
      await simulateNetworkDelay()
      const cityName = unslugify(slug)
      const city = getOrCreateMockCity(slug, cityName)
      return city
    }
  }

  /**
   * Obtiene las fotos de una ciudad
   */
  async getCityPhotos(cityId: string): Promise<CityMedia[]> {
    await simulateNetworkDelay(200)

    const city = await this.getCityBySlug(cityId)
    if (!city) return []

    return city.cityMedia.filter((media) => media.type === MediaType.IMAGE)
  }

  /**
   * Obtiene los videos de una ciudad
   */
  async getCityVideos(cityId: string): Promise<CityMedia[]> {
    await simulateNetworkDelay(200)

    const city = await this.getCityBySlug(cityId)
    if (!city) return []

    return city.cityMedia.filter((media) => media.type === MediaType.VIDEO)
  }

  /**
   * Da like a un media de ciudad
   */
  async likeCityMedia(cityMediaId: string): Promise<{ success: boolean }> {
    await simulateNetworkDelay(100)

    // En el mock simplemente retornamos éxito
    console.log(`[MOCK] Like added to media: ${cityMediaId}`)
    return { success: true }
  }

  /**
   * Quita like a un media de ciudad
   */
  async unlikeCityMedia(cityMediaId: string): Promise<{ success: boolean }> {
    await simulateNetworkDelay(100)

    console.log(`[MOCK] Like removed from media: ${cityMediaId}`)
    return { success: true }
  }

  /**
   * Sube un nuevo media a la ciudad
   */
  async uploadCityMedia(cityId: string, file: File, type: MediaType): Promise<CityMedia | null> {
    await simulateNetworkDelay(500)

    // En el mock, simulamos la subida
    console.log(`[MOCK] Uploading ${type} to city: ${cityId}`)

    const mockMedia: CityMedia = {
      id: `media-${Date.now()}`,
      cityId,
      userId: 'current-user',
      url: URL.createObjectURL(file),
      type,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      isLikedByUser: false,
      user: {
        id: 'current-user',
        username: 'currentuser',
        firstName: 'Usuario',
        lastName: 'Actual',
      },
    }

    return mockMedia
  }

  /**
   * Obtiene las estadísticas globales de la plataforma
   * Este método SÍ usa el API real porque ya existe el endpoint
   */
  async getGlobalStats(): Promise<GlobalStats> {
    try {
      return await jsonFetch<GlobalStats>('/api/cities/stats/global')
    } catch {
      // Global stats endpoint not yet migrated — fall back to mock data silently.
      return {
        totalCities: 12,
        totalUsers: 1200,
        totalPhotos: 350,
        totalVideos: 150,
        totalMedia: 500,
        totalPosts: 890,
        totalBusinesses: 240,
        totalServices: 180,
        totalDirectoryEntries: 420,
      }
    }
  }
}

/**
 * Instancia singleton del servicio
 */
export const cityService = new CityServiceMock()
