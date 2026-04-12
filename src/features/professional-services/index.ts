
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
  MOCK_CITIES,
  MOCK_PROFESSIONAL_SERVICES_BASIC,
  MOCK_PROFESSIONAL_SERVICES_FULL,
  MOCK_STATES,
  SERVICE_CATEGORIES,
  getAllCategories,
  getAllStates,
  getCitiesByState,
  getMockServiceById,
  getMockServiceBySlug,
  getMockServicesByCategory,
  getMockServicesByCity,
  getMockServicesByState,
} from './data/mock-professional-services'

export { professionalServiceService } from './services/professional-service.service'

export { useProfessionalServicesUIStore } from './store/professionalServicesUI.store'
export { useMockProfessionalServices } from './hooks/useMockProfessionalServices'

// Header & Navigation
export { ServiceHeaderWrapper } from './components/profile/ServiceHeaderWrapper'
export { ServiceHeader } from './components/ServiceHeader'
export { ServiceActions, ServiceBreadcrumb } from './components/ServiceNavigation'

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
