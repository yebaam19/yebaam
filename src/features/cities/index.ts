/**
 * Cities Module - Barrel Export
 *
 * Punto único de exportación para el módulo de ciudades.
 * Facilita importaciones limpias en otros módulos.
 *
 * @example
 * import { City, MOCK_CITIES, CITY_CATEGORIES, CityHeader } from '@/features/cities';
 */

// Interfaces & Types
export type {
  CitiesResponse,
  City,
  CityBasic,
  CityDetailResponse,
  CityMedia,
  Country,
  CreateCityMediaDTO,
  GetCitiesFilters,
  LikeCityMediaDTO,
  MediaAuthor,
  State,
} from './interfaces/city.interfaces'

export { MediaType } from './interfaces/city.interfaces'

export type { GlobalStats } from './interfaces/global-stats.interface'

// Data & Mocks
export { MOCK_CITIES, MOCK_CITY_DETAIL, getMockCityBySlug, getOrCreateMockCity } from './data/mock-cities'

export { CITY_CATEGORIES, getCityMenuItems, type Category, type CityMenuItem } from './data/categories'

// Services
export { cityService } from './services/city.service'
export { cityCategoryService, type CityCategory } from './services/city-category.service'

// Hooks
export { useActiveCategories, useCategoryBySlug, mapCategoryToMenuItem } from './hooks/useCategories'
export { useGlobalStats } from './hooks/useGlobalStats'

// Stores (opcional - para estado global)
export { useCategoriesStore, selectCategories, selectSelectedCategory, selectIsLoading, selectError } from './stores/categories.store'

// Components - Portal de ciudades
export { CitiesGrid } from './components/CitiesGrid'
export { CitiesHero } from './components/CitiesHero'
export { CityCard } from './components/CityCard'

// Components - Detalle de ciudad
export { CategoriesGrid } from './components/CategoriesGrid'
export { CategoryCard } from './components/CategoryCard'
export { CityHeader } from './components/CityHeader'
export { CityMediaDialog } from './components/CityMediaDialog'
export { CityMediaGallery } from './components/CityMediaGallery'
export { CityMediaUploader } from './components/CityMediaUploader'
export { CityMenu } from './components/CityMenu'
export { CityPhotoUploadDialog } from './components/CityPhotoUploadDialog'
export { CityTabs } from './components/CityTabs'
export { CityVideoUploadDialog } from './components/CityVideoUploadDialog'

// Directory Types & Interfaces
export type {
  Business,
  BusinessBasic,
  BusinessCategory,
  BusinessesResponse,
  DirectoryCategory,
  DirectoryFilters,
  ProfessionalService,
  ProfessionalServiceBasic,
  ProfessionalServiceCategory,
  ProfessionalServicesResponse,
} from './interfaces/directory.interfaces'

export {
  BusinessStatus,
  BusinessVisibility,
  DirectoryCategoryType,
  ProfessionalServiceStatus,
  ProfessionalServiceVisibility,
} from './interfaces/directory.interfaces'

// Directory Data & Mocks
export {
  BUSINESS_CATEGORIES,
  DIRECTORY_CATEGORIES,
  MOCK_BUSINESSES,
  MOCK_PROFESSIONAL_SERVICES,
  SERVICE_CATEGORIES,
} from './data/mock-directory'

// Directory Service
export { directoryService } from './services/directory.service'

// Directory Components
export { BusinessCard } from './components/directory/BusinessCard'
export { BusinessList } from './components/directory/BusinessList'
export { DirectoryCategoriesGrid } from './components/directory/DirectoryCategoriesGrid'
export { DirectoryCategoryCard } from './components/directory/DirectoryCategoryCard'
export { DirectoryHero } from './components/directory/DirectoryHero'
export { ServiceCard } from './components/directory/ServiceCard'
export { ServiceList } from './components/directory/ServiceList'
