import type { ProfessionalServiceVisibility } from './service.interfaces'
import type { ServiceMediaType } from './media.interfaces'
import type { PortfolioProject } from './portfolio.interfaces'

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
  /** Una o varias subcategorías de la taxonomía (PDF). */
  subcategoryIds?: string[]
  /** Hashtags para descubrimiento alterno en el directorio (PDF). */
  tags?: string[]
}

export interface UpdateProfessionalServiceDTO extends Partial<CreateProfessionalServiceDTO> {
  logoUrl?: string
  coverUrl?: string
  adImageUrl?: string
  /** Clave R2 desnuda (`cvs/AAAA/uuid.pdf`) devuelta por uploadService.uploadDocument;
   *  `''` limpia el CV guardado. Nunca una URL. Feature flag: SERVICES_CV_UPLOAD */
  cvKey?: string
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
