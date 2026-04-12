import { getAxiosInstance } from '@/lib/axios/axiosInstance'

/**
 * Interfaz de categoría desde la API
 */
export interface CityCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Respuesta de la API para categorías
 */
interface CategoriesResponse {
  categories: CityCategory[]
}

/**
 * Servicio para gestionar categorías de ciudades
 */
class CityCategoryService {
  private readonly baseUrl = '/api/city-categories'

  /**
   * Obtiene todas las categorías activas
   */
  async getActiveCategories(): Promise<CityCategory[]> {
    try {
      const axios = await getAxiosInstance()
      const response = await axios.get<CategoriesResponse>(`${this.baseUrl}/active`)
      return response.data.categories
    } catch (error) {
      console.error('Error fetching active categories:', error)
      // Fallback a datos estáticos si falla la API
      return this.getFallbackCategories()
    }
  }

  /**
   * Obtiene una categoría por slug
   */
  async getCategoryBySlug(slug: string): Promise<CityCategory | null> {
    try {
      const axios = await getAxiosInstance()
      const response = await axios.get<{ category: CityCategory }>(`${this.baseUrl}/${slug}`)
      return response.data.category
    } catch (error) {
      console.error(`Error fetching category ${slug}:`, error)
      return null
    }
  }

  /**
   * Datos de fallback si la API no está disponible
   * Mantiene compatibilidad mientras se migra
   */
  private getFallbackCategories(): CityCategory[] {
    return [
      {
        id: 'fallback-1',
        name: 'Historia y economía',
        slug: 'historia-economia',
        description: 'Conoce los orígenes y la actividad económica de la ciudad.',
        icon: 'BuildingLibraryIcon',
        color: '#16A44C',
        order: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'fallback-2',
        name: 'Eventos',
        slug: 'eventos',
        description: 'Festividades y actividades destacadas durante el año.',
        icon: 'CalendarDaysIcon',
        color: '#f59e0b',
        order: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'fallback-3',
        name: 'Sitios de interés',
        slug: 'sitios-interes',
        description: 'Descubre los lugares emblemáticos.',
        icon: 'MapPinIcon',
        color: '#f59e0b',
        order: 3,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'fallback-4',
        name: 'Restaurantes y cafeterías',
        slug: 'restaurantes-cafeterias',
        description: 'Explora la gastronomía local en cada rincón.',
        icon: 'BuildingStorefrontIcon',
        color: '#16A44C',
        order: 4,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Resto de categorías omitidas por brevedad - se mantendrían todas
    ]
  }
}

export const cityCategoryService = new CityCategoryService()
