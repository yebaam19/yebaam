/**
 * Directory Interfaces - Interfaces para el Directorio de Ciudades
 *
 * Define la estructura de datos para negocios,
 * servicios profesionales, y tipos auxiliares
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum BusinessVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  LIMITED = 'LIMITED',
}

export enum BusinessStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  SUSPENDED = 'SUSPENDED',
}

export enum ProfessionalServiceVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  LIMITED = 'LIMITED',
}

export enum ProfessionalServiceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  SUSPENDED = 'SUSPENDED',
}

export enum DirectoryCategoryType {
  ALL = 'ALL',
  BUSINESS = 'BUSINESS',
  SERVICE = 'SERVICE',
}

// ============================================================================
// CATEGORÍAS
// ============================================================================

/**
 * Categoría del directorio (para la página principal)
 */
export interface DirectoryCategory {
  id: string
  label: string
  icon: string // Nombre del icono de Heroicons
  color: string
  type: DirectoryCategoryType
  description?: string
}

/**
 * Categoría de negocio
 */
export interface BusinessCategory {
  id: string
  name: string
  description?: string
  iconUrl?: string
  createdAt: string
}

/**
 * Categoría de servicio profesional
 */
export interface ProfessionalServiceCategory {
  id: string
  name: string
  description?: string
  iconUrl?: string
  createdAt: string
}

// ============================================================================
// NEGOCIOS
// ============================================================================

/**
 * Negocio completo
 */
export interface Business {
  id: string
  name: string
  description?: string
  logoUrl?: string
  coverUrl?: string
  adImageUrl?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  visibility: BusinessVisibility
  status: BusinessStatus
  // Redes sociales
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  tiktokUrl?: string
  youtubeUrl?: string
  // Relaciones
  userId: string
  cityId: string
  categoryId: string
  tags: string[]
  createdAt: string
  updatedAt: string
  // Objetos relacionados
  category: BusinessCategory
  user?: {
    id: string
    username: string
    firstName: string
    lastName: string
    avatarUrl?: string
  }
  // Conteos
  _count: {
    reviews: number
    media: number
  }
}

/**
 * Negocio básico (para listados)
 */
export interface BusinessBasic {
  id: string
  slug: string
  name: string
  description?: string
  logoUrl?: string
  adImageUrl?: string
  address?: string
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  youtubeUrl?: string
  category: {
    id: string
    name: string
    iconUrl?: string
  }
  _count: {
    reviews: number
    media: number
  }
}

// ============================================================================
// SERVICIOS PROFESIONALES
// ============================================================================

/**
 * Servicio profesional completo
 */
export interface ProfessionalService {
  id: string
  name: string
  description?: string
  logoUrl?: string
  coverUrl?: string
  adImageUrl?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  visibility: ProfessionalServiceVisibility
  status: ProfessionalServiceStatus
  // Redes sociales
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  tiktokUrl?: string
  youtubeUrl?: string
  // Tarifas
  hourlyRate?: number
  dailyRate?: number
  projectRate?: number
  currency: string
  availableForHire: boolean
  workType: string[]
  // Relaciones
  userId: string
  cityId: string
  categoryId: string
  tags: string[]
  createdAt: string
  updatedAt: string
  // Objetos relacionados
  category: ProfessionalServiceCategory
  user?: {
    id: string
    username: string
    firstName: string
    lastName: string
    avatarUrl?: string
  }
  // Conteos
  _count: {
    reviews: number
    media: number
  }
}

/**
 * Servicio profesional básico (para listados)
 */
export interface ProfessionalServiceBasic {
  id: string
  name: string
  slug?: string // Para URLs amigables
  description?: string
  logoUrl?: string
  adImageUrl?: string
  address?: string
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  youtubeUrl?: string
  hourlyRate?: number
  currency: string
  availableForHire: boolean
  availability?: string // e.g., "Lun-Vie 9am-6pm"
  category: {
    id: string
    name: string
    iconUrl?: string
  }
  _count: {
    reviews: number
    media: number
  }
}

// ============================================================================
// RESPUESTAS
// ============================================================================

export interface BusinessesResponse {
  businesses: BusinessBasic[]
  total: number
}

export interface ProfessionalServicesResponse {
  services: ProfessionalServiceBasic[]
  total: number
}

// ============================================================================
// FILTROS
// ============================================================================

export interface DirectoryFilters {
  search?: string
  categoryId?: string
  letter?: string
  page?: number
  limit?: number
}
