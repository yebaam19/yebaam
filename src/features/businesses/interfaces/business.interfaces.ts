/**
 * Business Interfaces
 *
 * Define la estructura de datos para negocios,
 * media, reviews y tipos auxiliares.
 *
 * Basado en los modelos Prisma de Business
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

export enum BusinessMediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

// Labels para status
export const BUSINESS_STATUS_LABELS: Record<BusinessStatus, { label: string; variant: string }> = {
  [BusinessStatus.ACTIVE]: { label: 'Activo', variant: 'default' },
  [BusinessStatus.INACTIVE]: { label: 'Inactivo', variant: 'outline' },
  [BusinessStatus.PENDING_APPROVAL]: { label: 'Pendiente', variant: 'secondary' },
  [BusinessStatus.SUSPENDED]: { label: 'Suspendido', variant: 'destructive' },
}

// Labels para visibilidad
export const BUSINESS_VISIBILITY_LABELS: Record<BusinessVisibility, { label: string; description: string }> = {
  [BusinessVisibility.PUBLIC]: { label: 'Público', description: 'Visible para todos' },
  [BusinessVisibility.PRIVATE]: { label: 'Privado', description: 'Solo visible para ti' },
  [BusinessVisibility.LIMITED]: { label: 'Limitado', description: 'Visible para seguidores' },
}

// ============================================================================
// CATEGORÍA
// ============================================================================

export interface BusinessCategory {
  id: string
  name: string
  description?: string
  iconUrl?: string
  createdAt: string
}

// ============================================================================
// MEDIA
// ============================================================================

export interface BusinessMedia {
  id: string
  businessId: string
  type: BusinessMediaType
  url: string
  thumbnailUrl?: string
  caption?: string
  alt?: string
  order: number
  createdAt: string
}

// ============================================================================
// REVIEWS
// ============================================================================

export interface BusinessReviewAuthor {
  id: string
  username: string
  firstName: string
  lastName: string
  avatarUrl?: string
}

export interface BusinessReview {
  id: string
  businessId: string
  userId: string
  rating: number // 1-5
  title?: string
  content?: string
  comment?: string
  response?: string
  createdAt: Date
  updatedAt: string
  user: BusinessReviewAuthor
}

// ============================================================================
// CIUDAD Y USUARIO (Relaciones)
// ============================================================================

export interface BusinessCity {
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

export interface BusinessOwner {
  id: string
  username: string
  firstName: string
  lastName: string
  avatarUrl?: string
  email?: string
  isVerified?: boolean
}

// ============================================================================
// NEGOCIO
// ============================================================================

/**
 * Negocio completo (para vista de detalle)
 */
export interface Business {
  id: string
  name: string
  slug: string
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

  // Horarios de atención
  hours?: Record<string, string>

  // Relaciones
  userId: string
  cityId: string
  categoryId: string
  tags: string[]

  // Timestamps
  createdAt: Date
  updatedAt: string

  // Objetos relacionados
  user: BusinessOwner
  city: BusinessCity
  category: BusinessCategory

  // Media y reviews
  media: BusinessMedia[]
  reviews: BusinessReview[]

  // Conteos
  _count: {
    media: number
    reviews: number
  }

  // Estadísticas calculadas
  averageRating?: number
}

/**
 * Negocio básico (para listados)
 */
export interface BusinessBasic {
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
  category: {
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

export interface BusinessDetailResponse {
  business: Business
}

export interface BusinessesListResponse {
  businesses: BusinessBasic[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateBusinessDTO {
  name: string
  description?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  visibility?: BusinessVisibility
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  tiktokUrl?: string
  youtubeUrl?: string
  cityId: string
  categoryId: string
  tags?: string[]
}

export interface UpdateBusinessDTO extends Partial<CreateBusinessDTO> {
  logoUrl?: string
  coverUrl?: string
  adImageUrl?: string
  slug?: string
  hours?: Record<string, string>
}

export interface CreateBusinessMediaDTO {
  type: BusinessMediaType
  url: string
  caption?: string
}

export interface CreateBusinessReviewDTO {
  rating: number
  comment?: string
}

// ============================================================================
// FILTROS
// ============================================================================

export interface BusinessFilters {
  search?: string
  categoryId?: string
  cityId?: string
  stateId?: string
  minRating?: number
  status?: BusinessStatus
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
