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

export enum ServiceMediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export interface ProfessionalServiceCategory {
  id: string
  name: string
  description?: string
  iconUrl?: string
  createdAt: string
}

// ============================================================================
// MEDIA
// ============================================================================

export interface ProfessionalServiceMedia {
  id: string
  serviceId: string
  type: ServiceMediaType
  url: string
  caption?: string
  order: number
  createdAt: string
}

// ============================================================================
// REVIEWS
// ============================================================================

export interface ProfessionalServiceReviewAuthor {
  id: string
  username: string
  firstName: string
  lastName: string
  avatarUrl?: string
}

export interface ProfessionalServiceReview {
  id: string
  serviceId: string
  userId: string
  rating: number // 1-5
  comment?: string
  createdAt: string
  updatedAt: string
  user: ProfessionalServiceReviewAuthor
}

// ============================================================================
// CIUDAD Y USUARIO (Relaciones)
// ============================================================================

export interface ServiceCity {
  id: string
  name: string
  slug: string
  state?: {
    id: string
    name: string
  }
  country: {
    id: string
    name: string
  }
}

export interface ServiceOwner {
  id: string
  username: string
  firstName: string
  lastName: string
  avatarUrl?: string
  coverUrl?: string
  bio?: string
  email?: string
  isVerified?: boolean
  professionalProfileId?: string
}

// ============================================================================
// PORTAFOLIO
// ============================================================================

/**
 * Proyecto del portafolio profesional
 * Feature flag: SERVICES_PROJECTS_PORTFOLIO
 */
export interface PortfolioProject {
  title: string
  description?: string
  url?: string
  githubUrl?: string
  imageUrl?: string
  technologies?: string[]
  startDate?: string
  endDate?: string
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
// DTOs
// ============================================================================

export interface CreateProfessionalServiceDTO {
  name: string
  description?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  visibility?: ProfessionalServiceVisibility
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  tiktokUrl?: string
  youtubeUrl?: string
  hourlyRate?: number
  dailyRate?: number
  projectRate?: number
  currency?: string
  availableForHire?: boolean
  workType?: string[]
  cityId: string
  categoryId?: string
  tags?: string[]
}

export interface UpdateProfessionalServiceDTO extends Partial<CreateProfessionalServiceDTO> {
  logoUrl?: string
  coverUrl?: string
  adImageUrl?: string
  cvUrl?: string // Feature flag: SERVICES_CV_UPLOAD
  portfolioProjects?: PortfolioProject[] // Feature flag: SERVICES_PROJECTS_PORTFOLIO
}

export interface CreateServiceMediaDTO {
  type: ServiceMediaType
  url: string
  caption?: string
}

export interface CreateServiceReviewDTO {
  rating: number
  comment?: string
}

// ============================================================================
// FILTROS
// ============================================================================

export interface ProfessionalServiceFilters {
  search?: string
  categoryId?: string
  cityId?: string
  stateId?: string
  minRating?: number
  availableForHire?: boolean
  workType?: string[]
  status?: ProfessionalServiceStatus
  page?: number
  limit?: number
}

// ============================================================================
// UBICACIÓN (Para filtros)
// ============================================================================

export interface State {
  id: string
  name: string
  slug: string
  country: {
    id: string
    name: string
  }
}

export interface City {
  id: string
  name: string
  slug: string
  stateId: string
  state?: State
}

export interface LocationFiltersData {
  states: State[]
  cities: City[]
}
