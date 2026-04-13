'use client'

/**
 * BusinessesFilterBar Component
 *
 * Barra de filtros para negocios.
 */

import { useBusinessCategories, useCitiesByState, useStates } from '@/features/businesses/hooks'
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon } from '@/components/icons/heroicons-shim'

interface BusinessesFilterBarProps {
  searchQuery: string
  onSearchChange: (search: string) => void
  selectedCategoryId: string | null
  onCategoryChange: (categoryId: string | null) => void
  selectedStateId?: string | null
  onStateChange?: (stateId: string | null) => void
  selectedCityId: string | null
  onCityChange: (cityId: string | null) => void
  onClearFilters: () => void
}

export function BusinessesFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategoryId,
  onCategoryChange,
  selectedStateId,
  onStateChange,
  selectedCityId,
  onCityChange,
  onClearFilters,
}: BusinessesFilterBarProps) {
  // Fetch data from API
  const { data: categories = [], isLoading: loadingCategories } = useBusinessCategories()
  const { data: states = [], isLoading: loadingStates } = useStates()
  const { data: cities = [] } = useCitiesByState(selectedStateId || undefined)

  const hasFilters = searchQuery || selectedCategoryId || selectedStateId || selectedCityId

  return (
    <div className="mb-6 space-y-4 rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-800">
      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Buscar negocios..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pr-4 pl-10 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <FunnelIcon className="h-4 w-4 text-neutral-400" />

        {/* Category */}
        <select
          value={selectedCategoryId || ''}
          onChange={(e) => onCategoryChange(e.target.value || null)}
          disabled={loadingCategories}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700"
        >
          <option value="">{loadingCategories ? 'Cargando...' : 'Todas las categorías'}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* State */}
        {onStateChange && (
          <select
            value={selectedStateId || ''}
            onChange={(e) => onStateChange(e.target.value || null)}
            disabled={loadingStates}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700"
          >
            <option value="">{loadingStates ? 'Cargando...' : 'Todos los departamentos'}</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        )}

        {/* City */}
        <select
          value={selectedCityId || ''}
          onChange={(e) => onCityChange(e.target.value || null)}
          disabled={!selectedStateId || cities.length === 0}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700"
        >
          <option value="">Todas las ciudades</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>

        {/* Reset Button */}
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
          >
            <XMarkIcon className="h-4 w-4" />
            <span>Limpiar</span>
          </button>
        )}
      </div>
    </div>
  )
}
