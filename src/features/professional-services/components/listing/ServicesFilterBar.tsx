/**
 * ServicesFilterBar Component
 *
 * Barra de filtros para búsqueda de servicios profesionales.
 * Incluye búsqueda, filtros por ubicación y categoría.
 *
 * `filters` (que viene de la store) es la única fuente de verdad — incluido el
 * término de búsqueda (`filters.search`). El input sólo mantiene estado local
 * para el debounce y se sincroniza en ambos sentidos.
 */

'use client'

import { AdjustmentsHorizontalIcon, MagnifyingGlassIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'
import Input from '@/ui/Input'

import {
  City,
  ProfessionalServiceCategory,
  ProfessionalServiceFilters,
  State,
} from '../../interfaces/professional-service.interfaces'
import { ActiveFilterTags } from './filter-bar/ActiveFilterTags'
import { FilterSelect } from './filter-bar/FilterSelect'

// ============================================================================
// TYPES
// ============================================================================

interface ServicesFilterBarProps {
  filters: ProfessionalServiceFilters
  onFiltersChange: (filters: ProfessionalServiceFilters) => void
  states: State[]
  cities: City[]
  categories: ProfessionalServiceCategory[]
  isLoading?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ServicesFilterBar({
  filters,
  onFiltersChange,
  states,
  cities,
  categories,
  isLoading = false,
  className,
}: ServicesFilterBarProps) {
  const t = useTranslations('professional.services.filterBar')
  const [searchValue, setSearchValue] = useState(filters.search ?? '')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Último término emitido por este input hacia los filtros (estado, no ref:
  // las reglas de pureza prohíben leer refs durante el render). Distingue
  // cambios externos de `filters.search` (initialQuery, limpiar búsqueda) de
  // los ecos de nuestras propias emisiones, para no pisar lo que el usuario
  // sigue escribiendo.
  const [lastEmittedSearch, setLastEmittedSearch] = useState(filters.search ?? '')

  // Sincroniza cambios externos de `filters.search` hacia el input con el
  // patrón "ajustar estado durante el render" (sin setState en efectos).
  const external = filters.search ?? ''
  const [prevExternal, setPrevExternal] = useState(external)
  if (external !== prevExternal) {
    setPrevExternal(external)
    if (external !== lastEmittedSearch && external !== searchValue) {
      setSearchValue(external)
    }
  }

  // Debounce: el texto viaja a `filters.search`, que es lo que lee el fetch.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchValue || undefined
      if (next !== (filters.search || undefined)) {
        setLastEmittedSearch(searchValue)
        onFiltersChange({ ...filters, search: next, page: 1 })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue, filters, onFiltersChange])

  // Ciudades filtradas por estado seleccionado
  const filteredCities = filters.stateId ? cities.filter((city) => city.stateId === filters.stateId) : cities

  const handleStateChange = useCallback(
    (stateId: string) => {
      onFiltersChange({
        ...filters,
        stateId: stateId || undefined,
        cityId: undefined, // Reset city when state changes
        page: 1,
      })
    },
    [filters, onFiltersChange]
  )

  const handleCityChange = useCallback(
    (cityId: string) => {
      onFiltersChange({
        ...filters,
        cityId: cityId || undefined,
        page: 1,
      })
    },
    [filters, onFiltersChange]
  )

  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      onFiltersChange({
        ...filters,
        categoryId: categoryId || undefined,
        page: 1,
      })
    },
    [filters, onFiltersChange]
  )

  const clearFilters = useCallback(() => {
    setSearchValue('')
    setLastEmittedSearch('')
    onFiltersChange({ page: 1, limit: filters.limit })
  }, [filters.limit, onFiltersChange])

  const hasActiveFilters = Boolean(filters.search || filters.stateId || filters.cityId || filters.categoryId)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and mobile filter toggle */}
      <div className="flex gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pr-10 pl-10"
            disabled={isLoading}
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mobile filter toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-300 lg:hidden dark:border-neutral-700"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Desktop Filters */}
      <div className={cn('grid gap-3 lg:grid-cols-4', showMobileFilters ? 'grid-cols-1' : 'hidden lg:grid')}>
        <FilterSelect
          id="state-filter"
          label={t('stateLabel')}
          allLabel={t('stateAll')}
          value={filters.stateId ?? ''}
          options={states}
          onChange={handleStateChange}
          disabled={isLoading}
        />
        <FilterSelect
          id="city-filter"
          label={t('cityLabel')}
          allLabel={t('cityAll')}
          value={filters.cityId ?? ''}
          options={filteredCities}
          onChange={handleCityChange}
          disabled={isLoading || (!filters.stateId && filteredCities.length === 0)}
        />
        <FilterSelect
          id="category-filter"
          label={t('categoryLabel')}
          allLabel={t('categoryAll')}
          value={filters.categoryId ?? ''}
          options={categories}
          onChange={handleCategoryChange}
          disabled={isLoading}
        />

        {/* Clear Filters */}
        <div className="flex items-end">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
              disabled={isLoading}
            >
              <XMarkIcon className="h-4 w-4" />
              {t('clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Active filters tags */}
      {hasActiveFilters && (
        <ActiveFilterTags
          filters={filters}
          states={states}
          cities={cities}
          categories={categories}
          onRemoveSearch={() => {
            setSearchValue('')
            setLastEmittedSearch('')
            onFiltersChange({ ...filters, search: undefined, page: 1 })
          }}
          onRemoveState={() => handleStateChange('')}
          onRemoveCity={() => handleCityChange('')}
          onRemoveCategory={() => handleCategoryChange('')}
        />
      )}
    </div>
  )
}
