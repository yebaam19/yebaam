
'use client'

import { PlusIcon } from '@/components/icons/heroicons-shim'
import { useCallback } from 'react'

import { useServices } from '../hooks/useServices'
import { useFeaturedServices, useRecentServices } from '../hooks/useStats'
import { useAllProfiles } from '@/features/professional-profile/hooks/queries/useProfessionalProfileQueries'
import {
  City,
  ProfessionalServiceBasic,
  ProfessionalServiceCategory,
  State,
} from '../interfaces/professional-service.interfaces'
import { useProfessionalServicesUIStore } from '../store/professionalServicesUI.store'
import {
  CreateServiceModal,
  ProfilesGrid,
  ServicesFilterBar,
  ServicesGrid,
  ServicesHero,
  ServicesTabs,
} from './listing'

// ============================================================================
// TYPES
// ============================================================================

interface ProfessionalServicesListingContainerProps {
  initialServices: ProfessionalServiceBasic[]
  initialTotal: number
  states: State[]
  cities: City[]
  categories: ProfessionalServiceCategory[]
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function ServicesLoadingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
        >
          <div className="aspect-video mb-4 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
          <div className="mb-2 h-5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="mb-4 h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  type: 'my-services' | 'suggested' | 'discover' | 'search'
  onCreateClick: () => void
  onClearSearch?: () => void
  onDiscoverClick?: () => void
}

function EmptyState({ type, onCreateClick, onClearSearch, onDiscoverClick }: EmptyStateProps) {
  const config = {
    'my-services': {
      title: 'No tienes servicios profesionales',
      description: 'Crea tu primer servicio profesional y empieza a ofrecer tus servicios a la comunidad.',
      action: 'Crear mi primer servicio',
      onAction: onCreateClick,
    },
    suggested: {
      title: 'Sin sugerencias disponibles',
      description: 'No hay servicios sugeridos para ti en este momento. Explora la sección Descubrir.',
      action: 'Explorar servicios',
      onAction: onDiscoverClick,
    },
    discover: {
      title: 'No hay servicios disponibles',
      description: 'Sé el primero en crear un servicio profesional.',
      action: 'Crear servicio',
      onAction: onCreateClick,
    },
    search: {
      title: 'Sin resultados',
      description: 'No encontramos servicios que coincidan con tu búsqueda. Intenta con otros términos.',
      action: 'Limpiar búsqueda',
      onAction: onClearSearch,
    },
  }

  const { title, description, action, onAction } = config[type]

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 py-16 text-center dark:border-neutral-700">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <PlusIcon className="h-8 w-8 text-neutral-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mb-6 max-w-md text-neutral-600 dark:text-neutral-400">{description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
        >
          {action}
        </button>
      )}
    </div>
  )
}

// ============================================================================
// SEARCH RESULTS HEADER
// ============================================================================

function SearchResultsHeader({ totalResults }: { totalResults: number }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
        {totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
      </h2>
    </div>
  )
}


export function ProfessionalServicesListingContainer({
  initialServices,
  initialTotal,
  states,
  cities,
  categories,
}: ProfessionalServicesListingContainerProps) {
  // UI Store
  const { activeTab, setActiveTab, searchQuery, isSearching, setIsSearching, filters, setFilters, openCreateModal } =
    useProfessionalServicesUIStore()

  // Real API Queries
  // TODO: Implementar "mis servicios" cuando tengamos autenticación
  const { data: myServicesData, isLoading: isLoadingMy } = useServices({ /* agregar filtro por userId cuando esté disponible */ })
  const myServices = myServicesData?.services || []
  
  // Servicios sugeridos = featured services
  const { data: suggestedServices = [], isLoading: isLoadingSuggested } = useFeaturedServices(12)
  
  // Servicios para descubrir = todos los servicios (más resultados sin sección de categorías)
  const { data: discoverData, isLoading: isLoadingDiscover } = useServices({ page: 1, limit: 24 })
  const discoverServices = discoverData?.services || []

  // Perfiles profesionales para descubrir
  const { data: profilesData, isLoading: isLoadingProfiles } = useAllProfiles(24, 0)
  const professionalProfiles = profilesData?.profiles || []

  // Search query - aplicar filtros cuando hay búsqueda
  const shouldSearch = !!(searchQuery || filters.categoryId || filters.cityId || filters.stateId)
  const { data: searchResults, isLoading: isSearchLoading } = useServices(
    {
      search: searchQuery,
      categoryId: filters.categoryId,
      cityId: filters.cityId,
      stateId: filters.stateId,
      page: 1,
      limit: 50,
    },
    { enabled: shouldSearch }
  )

  // Handle filter changes from filter bar
  const handleFiltersChange = useCallback(
    (newFilters: typeof filters) => {
      setFilters(newFilters)
      // Si hay filtros activos, activar modo búsqueda
      const hasFilters = !!(newFilters.search || newFilters.categoryId || newFilters.cityId || newFilters.stateId)
      setIsSearching(hasFilters)
    },
    [setFilters, setIsSearching]
  )

  // Handle category selection
  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      setFilters({ ...filters, categoryId })
      setIsSearching(true)

      // Scroll to filter section
      document.getElementById('services-filters')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    },
    [filters, setFilters, setIsSearching]
  )

  // Determine which services to display
  const getServicesToDisplay = (): ProfessionalServiceBasic[] => {
    if (isSearching && (searchQuery || filters.categoryId || filters.cityId || filters.stateId)) {
      return searchResults?.services || []
    }

    switch (activeTab) {
      case 'my-services':
        return myServices
      case 'suggested':
        return suggestedServices
      case 'discover':
        return discoverServices
      default:
        return discoverServices
    }
  }

  const servicesToDisplay = getServicesToDisplay()

  const isLoading =
    (activeTab === 'my-services' && isLoadingMy) ||
    (activeTab === 'suggested' && isLoadingSuggested) ||
    (activeTab === 'discover' && isLoadingDiscover) ||
    (isSearching && isSearchLoading)

  // Determine empty state type
  const getEmptyStateType = (): 'my-services' | 'suggested' | 'discover' | 'search' => {
    if (isSearching) return 'search'
    return activeTab as 'my-services' | 'suggested' | 'discover'
  }

  // Show create button only in my-services tab
  const showCreateButton = activeTab === 'my-services'

  return (
    <div className="space-y-8">
      {/* Hero Section - Siempre visible como bienvenida */}
      <ServicesHero onCreateClick={() => openCreateModal()} showCreateButton={showCreateButton} />

      {/* Tabs */}
      {!isSearching && (
        <ServicesTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          myServicesCount={myServices.length}
          suggestedCount={suggestedServices.length}
          showMyServices={true}
        />
      )}

      {/* Search Results Header */}
      {isSearching && searchResults?.services && <SearchResultsHeader totalResults={searchResults.services.length} />}

      {/* Filters Section */}
      <section id="services-filters" className="scroll-mt-20">
        <ServicesFilterBar
          filters={{ ...filters, search: searchQuery }}
          onFiltersChange={handleFiltersChange}
          states={states}
          cities={cities}
          categories={categories}
          isLoading={isLoading}
        />
      </section>

      {/* Loading State */}
      {isLoading && <ServicesLoadingSkeleton />}

      {/* Services Grid */}
      {!isLoading && servicesToDisplay.length > 0 && <ServicesGrid services={servicesToDisplay} isLoading={false} />}

      {/* Professional Profiles Section - Only in Discover tab */}
      {activeTab === 'discover' && !isSearching && professionalProfiles.length > 0 && (
        <section className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Perfiles Profesionales</h2>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              Conecta con profesionales destacados de la comunidad
            </p>
          </div>
          <ProfilesGrid profiles={professionalProfiles} isLoading={isLoadingProfiles} />
        </section>
      )}

      {/* Empty States */}
      {!isLoading && servicesToDisplay.length === 0 && (
        <EmptyState
          type={getEmptyStateType()}
          onCreateClick={() => openCreateModal()}
          onClearSearch={() => {
            setIsSearching(false)
            setFilters({})
            useProfessionalServicesUIStore.getState().setSearchQuery('')
          }}
          onDiscoverClick={() => setActiveTab('discover')}
        />
      )}

      {/* Modal de creación */}
      <CreateServiceModal />
    </div>
  )
}
