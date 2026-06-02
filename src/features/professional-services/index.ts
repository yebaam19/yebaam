
export type {
  City,
  CreateProfessionalServiceDTO,
  CreateServiceMediaDTO,
  CreateServiceReviewDTO,
  LocationFiltersData,
  PortfolioProject,
  ProfessionalService,
  ProfessionalServiceBasic,
  ProfessionalServiceCategory,
  ProfessionalServiceDetailResponse,
  ProfessionalServiceFilters,
  ProfessionalServiceMedia,
  ProfessionalServiceReview,
  ProfessionalServiceReviewAuthor,
  ProfessionalServicesListResponse,
  ServiceCity,
  ServiceOwner,
  State,
  UpdateProfessionalServiceDTO,
} from './interfaces/professional-service.interfaces'

export {
  ProfessionalServiceStatus,
  ProfessionalServiceVisibility,
  ServiceMediaType,
} from './interfaces/professional-service.interfaces'
export {
  PROFESSIONAL_SERVICES_PATH,
  professionalServicePath,
  professionalServicesCityPath,
} from './constants/routes'
export {
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_TAXONOMY,
  findCategoryById,
  findSubcategoryById,
  getSubcategoriesForCategory,
} from './data/service-categories-taxonomy'
export type { ProfessionalServiceSubcategory } from './interfaces/professional-service.interfaces'

export { professionalServiceService } from './services/professional-service.service'

export { useProfessionalServicesUIStore } from './store/professionalServicesUI.store'

// Header & Navigation
export { ServiceHeaderWrapper } from './components/profile/ServiceHeaderWrapper'
export { ServiceHeader } from './components/ServiceHeader'
export { ServiceActions, ServiceBreadcrumb } from './components/ServiceNavigation'

// Profile layout (mockup pág. 9 — distribución de 3 columnas)
export { ProfileLayoutWrapper } from './components/profile/ProfileLayoutWrapper'

// Profile Components
export { AboutService } from './components/profile/AboutService'
export { EditServiceModal } from './components/profile/EditServiceModal'
export { ServiceMediaDialog } from './components/profile/ServiceMediaDialog'
export { ServiceMediaGallery } from './components/profile/ServiceMediaGallery'
export { ServiceOwnerCard } from './components/profile/ServiceOwnerCard'
export { ServiceReviews } from './components/profile/ServiceReviews'

// CV y Portafolio (Feature flags: SERVICES_CV_UPLOAD, SERVICES_PROJECTS_PORTFOLIO)
export { ServiceCV } from './components/ServiceCV'
export { ServicePortfolio } from './components/ServicePortfolio'

// Listing Components
export {
  CategoriesSection,
  CreateServiceModal,
  ServiceListCard,
  ServicesFilterBar,
  ServicesGrid,
  ServicesHero,
  ServicesTabs,
} from './components/listing'
export { ProfessionalServicesListingContainer } from './components/ProfessionalServicesListingContainer'
