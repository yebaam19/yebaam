'use client'

import { useBusinessSearch } from '@/features/businesses/hooks'
import { PlusIcon } from '@/components/icons/heroicons-shim'
import { useBusinessesUIStore } from '../../store/businessesUI.store'
import {
  BusinessCategoriesSection,
  BusinessesFilterBar,
  BusinessesGrid,
  BusinessesHero,
  BusinessesTabs,
  CreateBusinessModal,
} from '../listing'

// ============================================================================
// LOADING SKELETON
// ============================================================================

function BusinessesLoadingSkeleton() {
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
  type: 'my-businesses' | 'suggested' | 'discover' | 'search'
  onCreateClick: () => void
  onClearSearch?: () => void
  onDiscoverClick?: () => void
}

function EmptyState({ type, onCreateClick, onClearSearch, onDiscoverClick }: EmptyStateProps) {
  const config = {
    'my-businesses': {
      title: 'No tienes negocios registrados',
      description: 'Registra tu primer negocio y empieza a darlo a conocer en la comunidad.',
      action: 'Registrar mi primer negocio',
      onAction: onCreateClick,
    },
    suggested: {
      title: 'Sin sugerencias disponibles',
      description: 'No hay negocios sugeridos para ti en este momento. Explora la sección Descubrir.',
      action: 'Explorar negocios',
      onAction: onDiscoverClick,
    },
    discover: {
      title: 'No hay negocios disponibles',
      description: 'Sé el primero en registrar un negocio en tu comunidad.',
      action: 'Registrar negocio',
      onAction: onCreateClick,
    },
    search: {
      title: 'Sin resultados',
      description: 'No encontramos negocios que coincidan con tu búsqueda. Intenta con otros términos.',
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
// MOCK DATA BANNER
// ============================================================================

function MockDataBanner() {
  return (
    <div className="fixed right-4 bottom-4 z-50 rounded-lg bg-neutral-100 px-4 py-2 text-sm text-neutral-800 shadow-lg dark:bg-neutral-800 dark:text-neutral-200"></div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Contenedor del listado de negocios
 */
export function BusinessesListingContainer() {
  // Estado del store
  const { activeTab, isCreateModalOpen, setActiveTab, setCreateModalOpen, filters, setFilters } = useBusinessesUIStore()

  // Determinar si estamos en modo búsqueda
  const isSearching = !!(filters.search || filters.categoryId || filters.cityId)

  // Hook para obtener datos reales del backend
  const { data: businessesData, isLoading } = useBusinessSearch(
    filters.search,
    filters.categoryId || undefined,
    filters.cityId || undefined,
    filters.stateId || undefined,
    undefined, // minRating
    1, // page
    50 // limit - mostrar más resultados
  )

  // Handler para búsqueda
  const handleSearch = (query: string) => {
    setFilters({ ...filters, search: query })
  }

  // Handler para filtro de categoría
  const handleCategoryFilter = (categoryId: string | null) => {
    setFilters({ ...filters, categoryId })
  }

  // Handler para filtro de ciudad
  const handleCityFilter = (cityId: string | null) => {
    setFilters({ ...filters, cityId })
  }

  // Limpiar filtros
  const handleClearFilters = () => {
    setFilters({
      search: '',
      categoryId: null,
      stateId: null,
      cityId: null,
    })
  }

  // Determinar empty state type
  const getEmptyStateType = (): 'my-businesses' | 'suggested' | 'discover' | 'search' => {
    if (isSearching) return 'search'
    return activeTab as 'my-businesses' | 'suggested' | 'discover'
  }

  // Show create button only in my-businesses tab
  const showCreateButton = activeTab === 'my-businesses'

  // Show categories section only when in discover tab and no search
  const showCategoriesSection = activeTab === 'discover' && !isSearching

  const businessesToDisplay = businessesData?.businesses || []
  const totalResults = businessesData?.total || 0

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <BusinessesHero onCreateClick={() => setCreateModalOpen(true)} showCreateButton={showCreateButton} />

      {/* Tabs */}
      {!isSearching && (
        <BusinessesTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          myBusinessesCount={0}
          suggestedCount={0}
          showMyBusinesses={true}
        />
      )}

      {/* Search Results Header */}
      {isSearching && businessesToDisplay.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado
            {totalResults !== 1 ? 's' : ''}
          </h2>
        </div>
      )}

      {/* Filter Bar */}
      <section id="businesses-filters" className="scroll-mt-20">
        <BusinessesFilterBar
          searchQuery={filters.search || ''}
          onSearchChange={handleSearch}
          selectedCategoryId={filters.categoryId}
          selectedCityId={filters.cityId}
          onCategoryChange={handleCategoryFilter}
          onCityChange={handleCityFilter}
          onClearFilters={handleClearFilters}
        />
      </section>

      {/* Categories Section (only in discover without search) */}
      {showCategoriesSection && (
        <BusinessCategoriesSection selectedCategoryId={filters.categoryId} onCategorySelect={handleCategoryFilter} />
      )}

      {/* Loading State */}
      {isLoading && <BusinessesLoadingSkeleton />}

      {/* Businesses Grid */}
      {!isLoading && businessesToDisplay.length > 0 && (
        <BusinessesGrid businesses={businessesToDisplay} isLoading={false} />
      )}

      {/* Empty States */}
      {!isLoading && businessesToDisplay.length === 0 && (
        <EmptyState
          type={getEmptyStateType()}
          onCreateClick={() => setCreateModalOpen(true)}
          onClearSearch={handleClearFilters}
          onDiscoverClick={() => setActiveTab('discover')}
        />
      )}

      {/* Modal de Creación */}
      <CreateBusinessModal open={isCreateModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  )
}
