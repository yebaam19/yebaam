// ============================================================================
// Barrel — re-exports the domain sub-modules under ./professional-service/*.
// Split for readability; every original import specifier keeps resolving here.
// ============================================================================

// --- Categorías y taxonomía -------------------------------------------------
export type {
  ProfessionalServiceSubcategory,
  ProfessionalServiceCategory,
} from './professional-service/category.interfaces'

// --- Media (enum + tipos) ---------------------------------------------------
export { ServiceMediaType } from './professional-service/media.interfaces'
export type { ProfessionalServiceMedia } from './professional-service/media.interfaces'

// --- Reviews ----------------------------------------------------------------
export type {
  ProfessionalServiceReviewAuthor,
  ProfessionalServiceReview,
} from './professional-service/review.interfaces'

// --- Relaciones (ciudad y usuario del servicio) -----------------------------
export type {
  ServiceCity,
  ServiceOwner,
} from './professional-service/relations.interfaces'

// --- Portafolio -------------------------------------------------------------
export type { PortfolioProject } from './professional-service/portfolio.interfaces'

// --- Servicio profesional (enums + tipos + respuestas + filtros) ------------
export {
  ProfessionalServiceVisibility,
  ProfessionalServiceStatus,
} from './professional-service/service.interfaces'
export type {
  ProfessionalService,
  ProfessionalServiceBasic,
  ProfessionalServiceDetailResponse,
  ProfessionalServicesListResponse,
  ProfessionalServiceFilters,
} from './professional-service/service.interfaces'

// --- DTOs -------------------------------------------------------------------
export type {
  CreateProfessionalServiceDTO,
  UpdateProfessionalServiceDTO,
  CreateServiceMediaDTO,
  CreateServiceReviewDTO,
} from './professional-service/dto.interfaces'

// --- Ubicación (filtros) ----------------------------------------------------
export type {
  State,
  City,
  LocationFiltersData,
} from './professional-service/location.interfaces'
