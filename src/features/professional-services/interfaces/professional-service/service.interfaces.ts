import type {
  ProfessionalServiceCategory,
  ProfessionalServiceSubcategory,
} from './category.interfaces'
import type { ProfessionalServiceMedia } from './media.interfaces'
import type { ProfessionalServiceReview } from './review.interfaces'
import type { ServiceCity, ServiceOwner } from './relations.interfaces'
import type { PortfolioProject } from './portfolio.interfaces'

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

// ============================================================================
// SERVICIO PROFESIONAL
// ============================================================================

/**
 * Servicio profesional completo (para vista de detalle)
 */
export interface ProfessionalService {
  id: string
  name: string
  slug: string
  description?: string
  logoUrl?: string
  coverUrl?: string
  coverImage?: string // Cover del servicio (backend usa este nombre)
  adImageUrl?: string
  /** Downloadable virtual business card art (PDF "tarjeta de negocios virtual"). */
  businessCardUrl?: string
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
  workType?: string[] // e.g., ['remote', 'on-site', 'hybrid']

  // CV y Portafolio (Feature flags: SERVICES_CV_UPLOAD, SERVICES_PROJECTS_PORTFOLIO)
  cvUrl?: string
  portfolioProjects?: PortfolioProject[]

  // Relaciones
  userId: string
  cityId: string
  categoryId?: string
  tags?: string[]

  // Timestamps
  createdAt: string
  updatedAt: string

  // Objetos relacionados
  user?: ServiceOwner
  city: ServiceCity
  category?: ProfessionalServiceCategory
  /** Subcategorías elegidas de la taxonomía (PDF). */
  subcategories?: ProfessionalServiceSubcategory[]

  // Media y reviews
  media: ProfessionalServiceMedia[]
  reviews: ProfessionalServiceReview[]

  // Conteos
  _count: {
    media: number
    reviews: number
  }

  // Estadísticas calculadas
  averageRating?: number
}

/**
 * Servicio profesional básico (para listados - ya definido en directory)
 * Re-exportamos para consistencia
 */
export interface ProfessionalServiceBasic {
  id: string
  name: string
  slug: string
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
  availability?: string
  category?: {
    id: string
    name: string
    iconUrl?: string
  }
  city?: {
    id: string
    name: string
    slug: string
  }
  user?: {
    id: string
    username: string
    firstName: string
    lastName: string
    avatarUrl?: string
  }
  _count: {
    reviews: number
    media: number
  }
  averageRating?: number
}

// ============================================================================
// RESPUESTAS DE API
// ============================================================================

export interface ProfessionalServiceDetailResponse {
  service: ProfessionalService
}

export interface ProfessionalServicesListResponse {
  services: ProfessionalServiceBasic[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================================================
// FILTROS
// ============================================================================

export interface ProfessionalServiceFilters {
  search?: string
  categoryId?: string
  subcategoryId?: string
  cityId?: string
  stateId?: string
  minRating?: number
  availableForHire?: boolean
  workType?: string[]
  status?: ProfessionalServiceStatus
  page?: number
  limit?: number
}
