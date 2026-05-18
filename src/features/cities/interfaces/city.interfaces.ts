/**
 * Interfaces para el módulo de Ciudades
 *
 * Define la estructura de datos para ciudades,
 * medios de ciudades, y tipos auxiliares
 */

/**
 * Tipo de media (foto o video)
 */
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

/**
 * País
 */
export interface Country {
  id: string
  name: string
  code?: string
}

/**
 * Estado/Departamento
 */
export interface State {
  id: string
  name: string
  countryId: string
}

/**
 * Autor de un medio (información básica del usuario)
 */
export interface MediaAuthor {
  id: string
  username: string
  firstName: string
  lastName: string
  avatarUrl?: string
}

/**
 * Media de una ciudad (foto o video)
 */
export interface CityMedia {
  id: string
  cityId: string
  userId: string
  url: string
  type: MediaType
  createdAt: string
  likesCount: number
  isLikedByUser: boolean
  user: MediaAuthor
}

/**
 * Ciudad con relaciones
 */
export interface City {
  id: string
  name: string
  slug: string
  description: string
  stateId?: string
  countryId: string
  state?: State
  country: Country
  coverImageUrl?: string
  logoUrl?: string
  stats: {
    followerCount: number
    photoCount: number
    videoCount: number
    postCount: number
  }
  isFollowing: boolean
  isFeatured: boolean
  cityMedia: CityMedia[]
}

/**
 * Ciudad básica (para listados)
 */
export interface CityBasic {
  id: string
  name: string
  slug: string
  description: string
  coverImageUrl?: string
  logoUrl?: string
  state?: {
    id: string
    name: string
  }
  country: {
    id: string
    name: string
    code?: string
  }
  stats: {
    followerCount: number
    photoCount: number
    videoCount: number
    postCount: number
  }
  isFollowing: boolean
  isFeatured: boolean
}

/**
 * Respuesta de listado de ciudades
 */
export interface CitiesResponse {
  cities: CityBasic[]
  total: number
}

/**
 * Respuesta de detalle de ciudad
 */
export interface CityDetailResponse {
  city: City
}

/**
 * Filtros para obtener ciudades
 */
export interface GetCitiesFilters {
  search?: string
  countryId?: string
  stateId?: string
  page?: number
  limit?: number
}

/**
 * DTO para crear media de ciudad
 */
export interface CreateCityMediaDTO {
  cityId: string
  url: string
  type: MediaType
}

/**
 * DTO para dar like a media
 */
export interface LikeCityMediaDTO {
  cityMediaId: string
}
