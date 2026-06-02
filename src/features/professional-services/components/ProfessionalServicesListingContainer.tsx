'use client'

import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/features/auth'
import { listPublicProfilesAction } from '@/app/(app)/feed/professional-profile/server/profile.actions'
import type { ProfessionalProfile } from '@/features/professional-profile/interfaces/professional-profile.interfaces'

import { useServices } from '../hooks/useServices'
import { useFeaturedServices } from '../hooks/useStats'
import { servicesByUserIdAction } from '../actions/services.actions'
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
import { ServicesLoadingSkeleton } from './listing/container/ServicesLoadingSkeleton'
import { ServicesEmptyState } from './listing/container/ServicesEmptyState'
import { SearchResultsHeader } from './listing/container/SearchResultsHeader'

interface ProfessionalServicesListingContainerProps {
  initialServices: ProfessionalServiceBasic[]
  initialTotal: number
  states: State[]
  cities: City[]
  categories: ProfessionalServiceCategory[]
  /** Ciudad pre-seleccionada cuando se llega desde el portal (`?city=slug`). */
  initialCityId?: string
  /** Búsqueda pre-aplicada al llegar desde un hashtag (`?q=etiqueta`). */
  initialQuery?: string
}

export function ProfessionalServicesListingContainer({
  states,
  cities,
  categories,
  initialCityId,
  initialQuery,
}: ProfessionalServicesListingContainerProps) {
  const { user } = useAuth()
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    isSearching,
    setIsSearching,
    setSearchQuery,
    filters,
    setFilters,
    openCreateModal,
  } = useProfessionalServicesUIStore()

  // Pre-filtra por ciudad al llegar desde el portal de la ciudad (?city=slug → cityId).
  useEffect(() => {
    if (initialCityId) {
      setFilters({ cityId: initialCityId })
      setIsSearching(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCityId])

  // Pre-aplica la búsqueda al llegar desde un hashtag del perfil (?q=etiqueta).
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery)
      setIsSearching(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery])

  // "Mis servicios" = los servicios del usuario autenticado (no todo el directorio).
  const [myServicesRaw, setMyServicesRaw] = useState<ProfessionalServiceBasic[] | null>(null)
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    servicesByUserIdAction(user.id)
      .then((rows) => {
        if (!cancelled) setMyServicesRaw(rows)
      })
      .catch(() => {
        if (!cancelled) setMyServicesRaw([])
      })
    return () => {
      cancelled = true
    }
  }, [user?.id])
  const myServices = myServicesRaw ?? []
  const isLoadingMy = !!user && myServicesRaw === null

  // Servicios sugeridos = featured services.
  const { data: suggestedServicesRaw, isLoading: isLoadingSuggested } = useFeaturedServices(12)
  const suggestedServices = suggestedServicesRaw ?? []

  // Servicios para descubrir = todos los servicios.
  const { data: discoverData, isLoading: isLoadingDiscover } = useServices({ page: 1, limit: 24 })
  const discoverServices = discoverData?.services || []

  // Perfiles profesionales para descubrir.
  const [professionalProfiles, setProfessionalProfiles] = useState<ProfessionalProfile[]>([])
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true)
  useEffect(() => {
    let cancelled = false
    listPublicProfilesAction(24, 0)
      .then((result) => {
        if (cancelled) return
        setProfessionalProfiles(result.profiles)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProfiles(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Búsqueda — aplica filtros cuando hay término o filtros activos.
  const { data: searchResults, isLoading: isSearchLoading } = useServices({
    search: searchQuery,
    categoryId: filters.categoryId,
    cityId: filters.cityId,
    stateId: filters.stateId,
    page: 1,
    limit: 50,
  })

  const handleFiltersChange = useCallback(
    (newFilters: typeof filters) => {
      setFilters(newFilters)
      const hasFilters = !!(newFilters.search || newFilters.categoryId || newFilters.cityId || newFilters.stateId)
      setIsSearching(hasFilters)
    },
    [setFilters, setIsSearching],
  )

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

  const getEmptyStateType = (): 'my-services' | 'suggested' | 'discover' | 'search' => {
    if (isSearching) return 'search'
    return activeTab as 'my-services' | 'suggested' | 'discover'
  }

  const showCreateButton = activeTab === 'my-services'

  return (
    <div className="space-y-8">
      <ServicesHero onCreateClick={() => openCreateModal()} showCreateButton={showCreateButton} />

      {!isSearching && (
        <ServicesTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          myServicesCount={myServices.length}
          suggestedCount={suggestedServices.length}
          showMyServices={!!user}
        />
      )}

      {isSearching && searchResults?.services && <SearchResultsHeader totalResults={searchResults.services.length} />}

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

      {isLoading && <ServicesLoadingSkeleton />}

      {!isLoading && servicesToDisplay.length > 0 && <ServicesGrid services={servicesToDisplay} isLoading={false} />}

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

      {!isLoading && servicesToDisplay.length === 0 && (
        <ServicesEmptyState
          type={getEmptyStateType()}
          onCreateClick={() => openCreateModal()}
          onClearSearch={() => {
            setIsSearching(false)
            setFilters({})
            setSearchQuery('')
          }}
          onDiscoverClick={() => setActiveTab('discover')}
        />
      )}

      <CreateServiceModal />
    </div>
  )
}
